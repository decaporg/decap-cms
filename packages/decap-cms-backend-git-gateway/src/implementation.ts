import GoTrue from 'gotrue-js';
import jwtDecode from 'jwt-decode';
import { get, pick, intersection } from 'lodash';
import ini from 'ini';
import {
  APIError,
  unsentRequest,
  basename,
  entriesByFiles,
  parsePointerFile,
  getLargeMediaPatternsFromGitAttributesFile,
  getPointerFileForMediaFileObj,
  getLargeMediaFilteredMediaFiles,
  AccessTokenError,
  PreviewState,
} from 'decap-cms-lib-util';
import { GitHubBackend } from 'decap-cms-backend-github';
import { GitLabBackend } from 'decap-cms-backend-gitlab';
import { BitbucketBackend, API as BitBucketAPI } from 'decap-cms-backend-bitbucket';

import GitHubAPI from './GitHubAPI';
import GitLabAPI from './GitLabAPI';
import AuthenticationPage from './AuthenticationPage';
import { getClient } from './netlify-lfs-client';

import type { Client } from './netlify-lfs-client';
import type {
  ApiRequest,
  AssetProxy,
  PersistOptions,
  Entry,
  Cursor,
  Implementation,
  DisplayURL,
  User,
  Credentials,
  Config,
  ImplementationFile,
  DisplayURLObject,
} from 'decap-cms-lib-util';

const STATUS_PAGE = 'https://www.netlifystatus.com';
const GIT_GATEWAY_STATUS_ENDPOINT = `${STATUS_PAGE}/api/v2/components.json`;
const GIT_GATEWAY_OPERATIONAL_UNITS = ['Git Gateway'];
type GitGatewayStatus = {
  id: string;
  name: string;
  status: string;
};

type NetlifyIdentity = {
  logout: () => void;
  currentUser: () => User;
  on: (event: string, args: unknown) => void;
  init: () => void;
  store: { user: unknown; modal: { page: string }; saving: boolean };
};

type AuthClient = {
  logout: () => void;
  currentUser: () => unknown;
  login?(email: string, password: string, remember?: boolean): Promise<unknown>;
  clearStore: () => void;
};

declare global {
  interface Window {
    netlifyIdentity?: NetlifyIdentity;
  }
}

const localHosts: Record<string, boolean> = {
  localhost: true,
  '127.0.0.1': true,
  '0.0.0.0': true,
};
const defaults = {
  identity: '/.netlify/identity',
  gateway: '/.netlify/git',
  largeMedia: '/.netlify/large-media',
};

function getEndpoint(endpoint: string, netlifySiteURL: string | null) {
  if (
    localHosts[document.location.host.split(':').shift() as string] &&
    netlifySiteURL &&
    endpoint.match(/^\/\.netlify\//)
  ) {
    const parts = [];
    if (netlifySiteURL) {
      parts.push(netlifySiteURL);
      if (!netlifySiteURL.match(/\/$/)) {
        parts.push('/');
      }
    }
    parts.push(endpoint.replace(/^\//, ''));
    return parts.join('');
  }
  return endpoint;
}

// wait for identity widget to initialize
// force init on timeout
let initPromise = Promise.resolve() as Promise<unknown>;
if (window.netlifyIdentity) {
  let initialized = false;
  initPromise = Promise.race([
    new Promise<void>(resolve => {
      window.netlifyIdentity?.on('init', () => {
        initialized = true;
        resolve();
      });
    }),
    new Promise(resolve => setTimeout(resolve, 2500)).then(() => {
      if (!initialized) {
        console.log('Manually initializing identity widget');
        window.netlifyIdentity?.init();
      }
    }),
  ]);
}

interface NetlifyUser extends Credentials {
  jwt: () => Promise<string>;
  email: string;
  user_metadata: { full_name: string; avatar_url: string };
}

async function apiGet(path: string) {
  const apiRoot = 'https://api.netlify.com/api/v1/sites';
  const response = await fetch(`${apiRoot}/${path}`).then(res => res.json());
  return response;
}

export default class GitGateway implements Implementation {
  config: Config;
  api?: GitHubAPI | GitLabAPI | BitBucketAPI;
  branch: string;
  squashMerges: boolean;
  cmsLabelPrefix: string;
  mediaFolder: string;
  transformImages: boolean;
  gatewayUrl: string;
  netlifyLargeMediaURL: string;
  backendType: string | null;
  apiUrl: string;
  authClient?: AuthClient;
  backend: GitHubBackend | GitLabBackend | BitbucketBackend | null;
  acceptRoles?: string[];
  tokenPromise?: () => Promise<string>;
  _largeMediaClientPromise?: Promise<Client>;

  options: {
    proxied: boolean;
    API: GitHubAPI | GitLabAPI | BitBucketAPI | null;
    initialWorkflowStatus: string;
  };
  constructor(config: Config, options = {}) {
    this.options = {
      proxied: true,
      API: null,
      initialWorkflowStatus: '',
      ...options,
    };
    this.config = config;
    this.branch = config.backend.branch?.trim() || 'master';
    this.squashMerges = config.backend.squash_merges || false;
    this.cmsLabelPrefix = config.backend.cms_label_prefix || '';
    this.mediaFolder = config.media_folder;
    const { use_large_media_transforms_in_media_library: transformImages = true } = config.backend;
    this.transformImages = transformImages;

    const netlifySiteURL = localStorage.getItem('netlifySiteURL');
    this.apiUrl = getEndpoint(config.backend.identity_url || defaults.identity, netlifySiteURL);
    this.gatewayUrl = getEndpoint(config.backend.gateway_url || defaults.gateway, netlifySiteURL);
    this.netlifyLargeMediaURL = getEndpoint(
      config.backend.large_media_url || defaults.largeMedia,
      netlifySiteURL,
    );
    const backendTypeRegex = /\/(github|gitlab|bitbucket)\/?$/;
    const backendTypeMatches = this.gatewayUrl.match(backendTypeRegex);
    if (backendTypeMatches) {
      this.backendType = backendTypeMatches[1];
      this.gatewayUrl = this.gatewayUrl.replace(backendTypeRegex, '');
    } else {
      this.backendType = null;
    }

    this.backend = null;
    AuthenticationPage.authClient = () => this.getAuthClient();
  }

  isGitBackend() {
    return true;
  }

  async status() {
    const api = await fetch(GIT_GATEWAY_STATUS_ENDPOINT)
      .then(res => res.json())
      .then(res => {
        return res['components']
          .filter((statusComponent: GitGatewayStatus) =>
            GIT_GATEWAY_OPERATIONAL_UNITS.includes(statusComponent.name),
          )
          .every((statusComponent: GitGatewayStatus) => statusComponent.status === 'operational');
      })
      .catch(e => {
        console.warn('Failed getting Git Gateway status', e);
        return true;
      });

    let auth = false;
    // no need to check auth if api is down
    if (api) {
      auth =
        (await this.tokenPromise?.()
          .then(token => !!token)
          .catch(e => {
            console.warn('Failed getting Identity token', e);
            return false;
          })) || false;
    }

    return { auth: { status: auth }, api: { status: api, statusPage: STATUS_PAGE } };
  }

  async getAuthClient() {
    if (this.authClient) {
      return this.authClient;
    }
    await initPromise;
    if (window.netlifyIdentity) {
      this.authClient = {
        logout: () => window.netlifyIdentity?.logout(),
        currentUser: () => window.netlifyIdentity?.currentUser(),
        clearStore: () => {
          const store = window.netlifyIdentity?.store;
          if (store) {
            store.user = null;
            store.modal.page = 'login';
            store.saving = false;
          }
        },
      };
    } else {
      const goTrue = new GoTrue({ APIUrl: this.apiUrl });
      this.authClient = {
        logout: () => {
          const user = goTrue.currentUser();
          if (user) {
            return user.logout();
          }
        },
        currentUser: () => goTrue.currentUser(),
        login: goTrue.login.bind(goTrue),
        clearStore: () => undefined,
      };
    }
    return this.authClient;
  }

  requestFunction = (req: ApiRequest) =>
    this.tokenPromise!()
      .then(
        token => unsentRequest.withHeaders({ Authorization: `Bearer ${token}` }, req) as ApiRequest,
      )
      .then(unsentRequest.performRequest);

  authenticate(credentials: Credentials) {
    const user = credentials as NetlifyUser;
    this.tokenPromise = async () => {
      try {
        const func = user.jwt.bind(user);
        const token = await func();
        return token;
      } catch (error) {
        throw new AccessTokenError(`Failed getting access token: ${error.message}`);
      }
    };
    return this.tokenPromise!().then(async token => {
      if (!this.backendType) {
        const {
          github_enabled: githubEnabled,
          gitlab_enabled: gitlabEnabled,
          bitbucket_enabled: bitbucketEnabled,
          roles,
        } = await unsentRequest
          .fetchWithTimeout(`${this.gatewayUrl}/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(async res => {
            const contentType = res.headers.get('Content-Type') || '';
            if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
              throw new APIError(
                `Your Git Gateway backend is not returning valid settings. Please make sure it is enabled.`,
                res.status,
                'Git Gateway',
              );
            }
            const body = await res.json();

            if (!res.ok) {
              throw new APIError(
                `Git Gateway Error: ${body.message ? body.message : body}`,
                res.status,
                'Git Gateway',
              );
            }

            return body;
          });
        this.acceptRoles = roles;
        if (githubEnabled) {
          this.backendType = 'github';
        } else if (gitlabEnabled) {
          this.backendType = 'gitlab';
        } else if (bitbucketEnabled) {
          this.backendType = 'bitbucket';
        }
      }

      if (this.acceptRoles && this.acceptRoles.length > 0) {
        const userRoles = get(jwtDecode(token), 'app_metadata.roles', []);
        const validRole = intersection(userRoles, this.acceptRoles).length > 0;
        if (!validRole) {
          throw new Error("You don't have sufficient permissions to access Decap CMS");
        }
      }

      const userData = {
        name: user.user_metadata.full_name || user.email.split('@').shift()!,
        email: user.email,
        avatar_url: user.user_metadata.avatar_url,
        metadata: user.user_metadata,
      };
      const apiConfig = {
        apiRoot: `${this.gatewayUrl}/${this.backendType}`,
        branch: this.branch,
        tokenPromise: this.tokenPromise!,
        commitAuthor: pick(userData, ['name', 'email']),
        isLargeMedia: (filename: string) => this.isLargeMediaFile(filename),
        squashMerges: this.squashMerges,
        cmsLabelPrefix: this.cmsLabelPrefix,
        initialWorkflowStatus: this.options.initialWorkflowStatus,
      };

      if (this.backendType === 'github') {
        this.api = new GitHubAPI(apiConfig);
        this.backend = new GitHubBackend(this.config, { ...this.options, API: this.api });
      } else if (this.backendType === 'gitlab') {
        this.api = new GitLabAPI(apiConfig);
        this.backend = new GitLabBackend(this.config, { ...this.options, API: this.api });
      } else if (this.backendType === 'bitbucket') {
        this.api = new BitBucketAPI({
          ...apiConfig,
          requestFunction: this.requestFunction,
          hasWriteAccess: async () => true,
        });
        this.backend = new BitbucketBackend(this.config, { ...this.options, API: this.api });
      }

      if (!(await this.api!.hasWriteAccess())) {
        throw new Error("You don't have sufficient permissions to access Decap CMS");
      }
      return {
        name: userData.name,
        login: userData.email,
        avatar_url: userData.avatar_url,
      } as unknown as User;
    });
  }
  async restoreUser() {
    const client = await this.getAuthClient();
    const user = client.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user as Credentials);
  }
  authComponent() {
    return AuthenticationPage;
  }

  async logout() {
    const client = await this.getAuthClient();
    try {
      client.logout();
    } catch (e) {
      // due to a bug in the identity widget (gotrue-js actually) the store is not reset if logout fails
      // TODO: remove after https://github.com/netlify/gotrue-js/pull/83 is merged
      client.clearStore();
    }
  }
  getToken() {
    return this.tokenPromise!();
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    return this.backend!.entriesByFolder(folder, extension, depth);
  }
  allEntriesByFolder(folder: string, extension: string, depth: number, pathRegex?: RegExp) {
    return this.backend!.allEntriesByFolder(folder, extension, depth, pathRegex);
  }
  entriesByFiles(files: ImplementationFile[]) {
    return this.backend!.entriesByFiles(files);
  }
  getEntry(path: string) {
    return this.backend!.getEntry(path);
  }

  async unpublishedEntryDataFile(collection: string, slug: string, path: string, id: string) {
    return this.backend!.unpublishedEntryDataFile(collection, slug, path, id);
  }

  async isLargeMediaFile(path: string) {
    const client = await this.getLargeMediaClient();
    return client.enabled && client.matchPath(path);
  }

  async unpublishedEntryMediaFile(collection: string, slug: string, path: string, id: string) {
    const isLargeMedia = await this.isLargeMediaFile(path);
    if (isLargeMedia) {
      const branch = this.backend!.getBranch(collection, slug);
      const { url, blob } = await this.getLargeMediaDisplayURL({ path, id }, branch);
      return {
        id,
        name: basename(path),
        path,
        url,
        displayURL: url,
        file: new File([blob], basename(path)),
        size: blob.size,
      };
    } else {
      return this.backend!.unpublishedEntryMediaFile(collection, slug, path, id);
    }
  }

  getMedia(mediaFolder = this.mediaFolder) {
    return this.backend!.getMedia(mediaFolder);
  }

  // this method memoizes this._getLargeMediaClient so that there can
  // only be one client at a time
  getLargeMediaClient() {
    if (this._largeMediaClientPromise) {
      return this._largeMediaClientPromise;
    }
    this._largeMediaClientPromise = this._getLargeMediaClient();
    return this._largeMediaClientPromise;
  }
  _getLargeMediaClient() {
    const netlifyLargeMediaEnabledPromise = this.api!.readFile('.lfsconfig')
      .then(config => ini.decode<{ lfs: { url: string } }>(config as string))
      .then(({ lfs: { url } }) => new URL(url))
      .then(lfsURL => ({
        enabled: lfsURL.hostname.endsWith('netlify.com') || lfsURL.hostname.endsWith('netlify.app'),
      }))
      .catch((err: Error) => ({ enabled: false, err }));

    const lfsPatternsPromise = this.api!.readFile('.gitattributes')
      .then(attributes => getLargeMediaPatternsFromGitAttributesFile(attributes as string))
      .then((patterns: string[]) => ({ err: null, patterns }))
      .catch((err: Error) => {
        if (err.message.includes('404')) {
          console.log('This 404 was expected and handled appropriately.');
          return { err: null, patterns: [] as string[] };
        } else {
          return { err, patterns: [] as string[] };
        }
      });

    return Promise.all([netlifyLargeMediaEnabledPromise, lfsPatternsPromise]).then(
      ([{ enabled: maybeEnabled }, { patterns, err: patternsErr }]) => {
        const enabled = maybeEnabled && !patternsErr;

        // We expect LFS patterns to exist when the .lfsconfig states
        // that we're using Netlify Large Media
        if (maybeEnabled && patternsErr) {
          console.error(patternsErr);
        }

        return getClient({
          enabled,
          rootURL: this.netlifyLargeMediaURL,
          makeAuthorizedRequest: this.requestFunction,
          patterns,
          transformImages: this.transformImages ? { nf_resize: 'fit', w: 560, h: 320 } : false,
        });
      },
    );
  }
  async getLargeMediaDisplayURL(
    { path, id }: { path: string; id: string | null },
    branch = this.branch,
  ) {
    const readFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { branch, parseText });

    const items = await entriesByFiles(
      [{ path, id }],
      readFile,
      this.api!.readFileMetadata.bind(this.api),
      'Git-Gateway',
    );
    const entry = items[0];
    const pointerFile = parsePointerFile(entry.data);
    if (!pointerFile.sha) {
      console.warn(`Failed parsing pointer file ${path}`);
      return { url: path, blob: new Blob() };
    }

    const client = await this.getLargeMediaClient();
    const { url, blob } = await client.getDownloadURL(pointerFile);
    return { url, blob };
  }

  async getMediaDisplayURL(displayURL: DisplayURL) {
    const { path, id } = displayURL as DisplayURLObject;
    const isLargeMedia = await this.isLargeMediaFile(path);
    if (isLargeMedia) {
      const { url } = await this.getLargeMediaDisplayURL({ path, id });
      return url;
    }
    if (typeof displayURL === 'string') {
      return displayURL;
    }

    const url = await this.backend!.getMediaDisplayURL(displayURL);
    return url;
  }

  async getMediaFile(path: string) {
    const isLargeMedia = await this.isLargeMediaFile(path);
    if (isLargeMedia) {
      const { url, blob } = await this.getLargeMediaDisplayURL({ path, id: null });
      return {
        id: url,
        name: basename(path),
        path,
        url,
        displayURL: url,
        file: new File([blob], basename(path)),
        size: blob.size,
      };
    }
    return this.backend!.getMediaFile(path);
  }

  async persistEntry(entry: Entry, options: PersistOptions) {
    const client = await this.getLargeMediaClient();
    if (client.enabled) {
      const assets = await getLargeMediaFilteredMediaFiles(client, entry.assets);
      return this.backend!.persistEntry({ ...entry, assets }, options);
    } else {
      return this.backend!.persistEntry(entry, options);
    }
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const { fileObj, path } = mediaFile;
    const displayURL = fileObj ? URL.createObjectURL(fileObj) : '';
    const client = await this.getLargeMediaClient();
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    const isLargeMedia = await this.isLargeMediaFile(fixedPath);
    if (isLargeMedia) {
      const persistMediaArgument = await getPointerFileForMediaFileObj(
        client,
        fileObj as File,
        path,
      );
      return {
        ...(await this.backend!.persistMedia(persistMediaArgument, options)),
        displayURL,
      };
    }
    return await this.backend!.persistMedia(mediaFile, options);
  }
  deleteFiles(paths: string[], commitMessage: string) {
    return this.backend!.deleteFiles(paths, commitMessage);
  }
  async getDeployPreview(collection: string, slug: string) {
    let preview = await this.backend!.getDeployPreview(collection, slug);
    if (!preview) {
      try {
        // if the commit doesn't have a status, try to use Netlify API directly
        // this is useful when builds are queue up in Netlify and don't have a commit status yet
        // and only works with public logs at the moment
        // TODO: get Netlify API Token and use it to access private logs
        const siteId = new URL(localStorage.getItem('netlifySiteURL') || '').hostname;
        const site = await apiGet(siteId);
        const deploys: { state: string; commit_ref: string; deploy_url: string }[] = await apiGet(
          `${site.id}/deploys?per_page=100`,
        );
        if (deploys.length > 0) {
          const ref = await this.api!.getUnpublishedEntrySha(collection, slug);
          const deploy = deploys.find(d => d.commit_ref === ref);
          if (deploy) {
            preview = {
              status: deploy.state === 'ready' ? PreviewState.Success : PreviewState.Other,
              url: deploy.deploy_url,
            };
          }
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    return preview;
  }
  unpublishedEntries() {
    return this.backend!.unpublishedEntries();
  }
  unpublishedEntry({ id, collection, slug }: { id?: string; collection?: string; slug?: string }) {
    return this.backend!.unpublishedEntry({ id, collection, slug });
  }
  updateUnpublishedEntryStatus(collection: string, slug: string, newStatus: string) {
    return this.backend!.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }
  deleteUnpublishedEntry(collection: string, slug: string) {
    return this.backend!.deleteUnpublishedEntry(collection, slug);
  }
  publishUnpublishedEntry(collection: string, slug: string) {
    return this.backend!.publishUnpublishedEntry(collection, slug);
  }
  traverseCursor(cursor: Cursor, action: string) {
    return this.backend!.traverseCursor!(cursor, action);
  }
}
