import GoTrue from 'gotrue-js';
import jwtDecode from 'jwt-decode';
import { fromPairs, get, pick, intersection, unzip } from 'lodash';
import ini from 'ini';
import {
  APIError,
  unsentRequest,
  basename,
  ApiRequest,
  AssetProxy,
  PersistOptions,
  Entry,
  Cursor,
  Implementation,
  DisplayURL,
  User,
  Credentials,
  entriesByFiles,
  Config,
  ImplementationFile,
  UnpublishedEntryMediaFile,
  parsePointerFile,
  getLargeMediaPatternsFromGitAttributesFile,
  PointerFile,
  getPointerFileForMediaFileObj,
  getLargeMediaFilteredMediaFiles,
} from 'netlify-cms-lib-util';
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { BitbucketBackend, API as BitBucketAPI } from 'netlify-cms-backend-bitbucket';
import GitHubAPI from './GitHubAPI';
import GitLabAPI from './GitLabAPI';
import AuthenticationPage from './AuthenticationPage';
import { getClient, Client } from './netlify-lfs-client';

declare global {
  interface Window {
    netlifyIdentity?: { gotrue: GoTrue; logout: () => void };
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

interface NetlifyUser extends Credentials {
  jwt: () => Promise<string>;
  email: string;
  user_metadata: { full_name: string; avatar_url: string };
}

interface GetMediaDisplayURLArgs {
  path: string;
  original: { id: string; path: string } | string;
  largeMedia: PointerFile;
}

export default class GitGateway implements Implementation {
  config: Config;
  api?: GitHubAPI | GitLabAPI | BitBucketAPI;
  branch: string;
  squashMerges: boolean;
  mediaFolder: string;
  transformImages: boolean;
  gatewayUrl: string;
  netlifyLargeMediaURL: string;
  backendType: string | null;
  authClient: GoTrue;
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
    this.mediaFolder = config.media_folder;
    this.transformImages = config.backend.use_large_media_transforms_in_media_library || true;

    const netlifySiteURL = localStorage.getItem('netlifySiteURL');
    const APIUrl = getEndpoint(config.backend.identity_url || defaults.identity, netlifySiteURL);
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

    this.authClient = window.netlifyIdentity
      ? window.netlifyIdentity.gotrue
      : new GoTrue({ APIUrl });
    AuthenticationPage.authClient = this.authClient;

    this.backend = null;
  }

  requestFunction = (req: ApiRequest) =>
    this.tokenPromise!()
      .then(
        token => unsentRequest.withHeaders({ Authorization: `Bearer ${token}` }, req) as ApiRequest,
      )
      .then(unsentRequest.performRequest);

  authenticate(credentials: Credentials) {
    const user = credentials as NetlifyUser;
    this.tokenPromise = user.jwt.bind(user);
    return this.tokenPromise!().then(async token => {
      if (!this.backendType) {
        const {
          github_enabled: githubEnabled,
          gitlab_enabled: gitlabEnabled,
          bitbucket_enabled: bitbucketEnabled,
          roles,
        } = await fetch(`${this.gatewayUrl}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async res => {
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
          throw new Error("You don't have sufficient permissions to access Netlify CMS");
        }
      }

      const userData = {
        name: user.user_metadata.full_name || user.email.split('@').shift()!,
        email: user.email,
        // eslint-disable-next-line @typescript-eslint/camelcase
        avatar_url: user.user_metadata.avatar_url,
        metadata: user.user_metadata,
      };
      const apiConfig = {
        apiRoot: `${this.gatewayUrl}/${this.backendType}`,
        branch: this.branch,
        tokenPromise: this.tokenPromise!,
        commitAuthor: pick(userData, ['name', 'email']),
        squashMerges: this.squashMerges,
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
        throw new Error("You don't have sufficient permissions to access Netlify CMS");
      }
      return { name: userData.name, login: userData.email } as User;
    });
  }
  restoreUser() {
    const user = this.authClient && this.authClient.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user as Credentials);
  }
  authComponent() {
    return AuthenticationPage;
  }

  logout() {
    if (window.netlifyIdentity) {
      return window.netlifyIdentity.logout();
    }
    const user = this.authClient.currentUser();
    return user && user.logout();
  }
  getToken() {
    return this.tokenPromise!();
  }

  entriesByFolder(folder: string, extension: string, depth: number) {
    return this.backend!.entriesByFolder(folder, extension, depth);
  }
  entriesByFiles(files: ImplementationFile[]) {
    return this.backend!.entriesByFiles(files);
  }
  getEntry(path: string) {
    return this.backend!.getEntry(path);
  }

  async loadEntryMediaFiles(branch: string, files: UnpublishedEntryMediaFile[]) {
    const client = await this.getLargeMediaClient();
    const backend = this.backend as GitLabBackend | GitHubBackend;
    if (!client.enabled) {
      return backend!.loadEntryMediaFiles(branch, files);
    }

    const mediaFiles = await Promise.all(
      files.map(async file => {
        if (client.matchPath(file.path)) {
          const { id, path } = file;
          const largeMediaDisplayURLs = await this.getLargeMediaDisplayURLs(
            [{ ...file, id }],
            branch,
          );
          const url = await client.getDownloadURL(largeMediaDisplayURLs[id]);
          return {
            id,
            name: basename(path),
            path,
            url,
            displayURL: url,
            file: new File([], name),
            size: 0,
          };
        } else {
          return backend!.loadMediaFile(branch, file);
        }
      }),
    );

    return mediaFiles;
  }

  getMedia(mediaFolder = this.mediaFolder) {
    return Promise.all([this.backend!.getMedia(mediaFolder), this.getLargeMediaClient()]).then(
      async ([mediaFiles, largeMediaClient]) => {
        if (!largeMediaClient.enabled) {
          return mediaFiles.map(({ displayURL, ...rest }) => ({
            ...rest,
            displayURL: { original: displayURL },
          }));
        }
        if (mediaFiles.length === 0) {
          return [];
        }
        const largeMediaDisplayURLs = await this.getLargeMediaDisplayURLs(mediaFiles);
        return mediaFiles.map(({ id, displayURL, path, ...rest }) => {
          return {
            ...rest,
            id,
            path,
            displayURL: {
              path,
              original: displayURL,
              largeMedia: largeMediaDisplayURLs[id],
            },
          };
        });
      },
    );
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
      .then(lfsURL => ({ enabled: lfsURL.hostname.endsWith('netlify.com') }))
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
          transformImages: this.transformImages
            ? // eslint-disable-next-line @typescript-eslint/camelcase
              { nf_resize: 'fit', w: 560, h: 320 }
            : false,
        });
      },
    );
  }
  async getLargeMediaDisplayURLs(
    mediaFiles: { path: string; id: string | null }[],
    branch = this.branch,
  ) {
    const client = await this.getLargeMediaClient();
    const readFile = (
      path: string,
      id: string | null | undefined,
      { parseText }: { parseText: boolean },
    ) => this.api!.readFile(path, id, { branch, parseText });

    const filesPromise = entriesByFiles(mediaFiles, readFile, 'Git-Gateway');

    return filesPromise
      .then(items =>
        items.map(({ file: { id, path }, data }) => {
          const parsedPointerFile = parsePointerFile(data);
          if (!parsedPointerFile.sha) {
            console.warn(`Failed parsing pointer file ${path}`);
          }
          return [
            {
              pointerId: id,
              resourceId: parsedPointerFile.sha,
            },
            parsedPointerFile,
          ];
        }),
      )
      .then(unzip)
      .then(([idMaps, files]) =>
        Promise.all([
          idMaps as { pointerId: string; resourceId: string }[],
          client.getResourceDownloadURLArgs(files as PointerFile[]).then(r => fromPairs(r)),
        ]),
      )
      .then(([idMaps, resourceMap]) =>
        idMaps.map(({ pointerId, resourceId }) => [pointerId, resourceMap[resourceId]]),
      )
      .then(fromPairs);
  }

  getMediaDisplayURL(displayURL: DisplayURL) {
    const {
      path,
      original,
      largeMedia: largeMediaDisplayURL,
    } = (displayURL as unknown) as GetMediaDisplayURLArgs;
    return this.getLargeMediaClient().then(client => {
      if (client.enabled && client.matchPath(path)) {
        return client.getDownloadURL(largeMediaDisplayURL);
      }
      if (typeof original === 'string') {
        return original;
      }
      if (this.backend!.getMediaDisplayURL) {
        return this.backend!.getMediaDisplayURL(original);
      }
      const err = new Error(
        `getMediaDisplayURL is not implemented by the ${this.backendType} backend, but the backend returned a displayURL which was not a string!`,
      ) as Error & {
        displayURL: DisplayURL;
      };
      err.displayURL = displayURL;
      return Promise.reject(err);
    });
  }

  async getMediaFile(path: string) {
    const client = await this.getLargeMediaClient();
    if (client.enabled && client.matchPath(path)) {
      const largeMediaDisplayURLs = await this.getLargeMediaDisplayURLs([{ path, id: null }]);
      const url = await client.getDownloadURL(Object.values(largeMediaDisplayURLs)[0]);
      return {
        id: url,
        name: basename(path),
        path,
        url,
        displayURL: url,
      };
    }
    return this.backend!.getMediaFile(path);
  }

  async persistEntry(entry: Entry, mediaFiles: AssetProxy[], options: PersistOptions) {
    const client = await this.getLargeMediaClient();
    return this.backend!.persistEntry(
      entry,
      client.enabled ? await getLargeMediaFilteredMediaFiles(client, mediaFiles) : mediaFiles,
      options,
    );
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const { fileObj, path } = mediaFile;
    const displayURL = URL.createObjectURL(fileObj);
    const client = await this.getLargeMediaClient();
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    if (!client.enabled || !client.matchPath(fixedPath)) {
      return this.backend!.persistMedia(mediaFile, options);
    }

    const persistMediaArgument = await getPointerFileForMediaFileObj(client, fileObj as File, path);
    return {
      ...(await this.backend!.persistMedia(persistMediaArgument, options)),
      displayURL,
    };
  }
  deleteFile(path: string, commitMessage: string) {
    return this.backend!.deleteFile(path, commitMessage);
  }
  async getDeployPreview(collection: string, slug: string) {
    return this.backend!.getDeployPreview(collection, slug);
  }
  unpublishedEntries() {
    return this.backend!.unpublishedEntries();
  }
  unpublishedEntry(collection: string, slug: string) {
    return this.backend!.unpublishedEntry(collection, slug, {
      loadEntryMediaFiles: (branch, files) => this.loadEntryMediaFiles(branch, files),
    });
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
    return (this.backend as GitLabBackend | BitbucketBackend).traverseCursor!(cursor, action);
  }
}
