import GoTrue from 'gotrue-js';
import jwtDecode from 'jwt-decode';
import { fromPairs, get, pick, intersection, unzip } from 'lodash';
import ini from 'ini';
import {
  APIError,
  getBlobSHA,
  unsentRequest,
  basename,
  Map,
  ApiRequest,
  AssetProxy,
  PersistOptions,
  Entry,
  CursorType,
  Implementation,
  DisplayURL,
  Collection,
} from 'netlify-cms-lib-util';
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { BitbucketBackend, API as BitBucketAPI } from 'netlify-cms-backend-bitbucket';
import GitHubAPI from './GitHubAPI';
import GitLabAPI from './GitLabAPI';
import AuthenticationPage from './AuthenticationPage';
import {
  parsePointerFile,
  createPointerFile,
  getLargeMediaPatternsFromGitAttributesFile,
  getClient,
  Client,
  PointerFile,
} from './netlify-lfs-client';

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

interface NetlifyUser {
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
  config: Map;
  api?: GitHubAPI | GitLabAPI | BitBucketAPI;
  branch: string;
  squashMerges: string;
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
  constructor(config: Map, options = {}) {
    this.options = {
      proxied: true,
      API: null,
      initialWorkflowStatus: '',
      ...options,
    };
    this.config = config;
    this.branch = config.getIn(['backend', 'branch'], 'master').trim();
    this.squashMerges = config.getIn(['backend', 'squash_merges']);

    const netlifySiteURL = localStorage.getItem('netlifySiteURL');
    const APIUrl = getEndpoint(
      config.getIn(['backend', 'identity_url'], defaults.identity),
      netlifySiteURL,
    );
    this.gatewayUrl = getEndpoint(
      config.getIn(['backend', 'gateway_url'], defaults.gateway),
      netlifySiteURL,
    );
    this.netlifyLargeMediaURL = getEndpoint(
      config.getIn(['backend', 'large_media_url'], defaults.largeMedia),
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

  authenticate(user: NetlifyUser) {
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
      return { name: userData.name, login: userData.email };
    });
  }
  restoreUser() {
    const user = this.authClient && this.authClient.currentUser();
    if (!user) return Promise.reject();
    return this.authenticate(user);
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

  entriesByFolder(collection: Collection, extension: string) {
    return this.backend!.entriesByFolder(collection, extension);
  }
  entriesByFiles(collection: Collection) {
    return this.backend!.entriesByFiles(collection);
  }
  fetchFiles(files: { path: string; sha: string | null }[]) {
    return this.backend!.fetchFiles(files);
  }
  getEntry(collection: Collection, slug: string, path: string) {
    return this.backend!.getEntry(collection, slug, path);
  }

  async loadEntryMediaFiles(files: { sha: string; path: string }[]) {
    const client = await this.getLargeMediaClient();
    const backend = this.backend as GitHubBackend;
    if (!client.enabled) {
      return backend.loadEntryMediaFiles(files);
    }

    const mediaFiles = await Promise.all(
      files.map(async file => {
        if (client.matchPath(file.path)) {
          const { sha: id, path } = file;
          const largeMediaDisplayURLs = await this.getLargeMediaDisplayURLs([{ ...file, id }]);
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
          return backend.loadMediaFile(file);
        }
      }),
    );

    return mediaFiles;
  }

  getMedia(mediaFolder = this.config.get<string>('media_folder')) {
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
          transformImages: this.config.getIn(
            ['backend', 'use_large_media_transforms_in_media_library'],
            true,
          )
            ? // eslint-disable-next-line @typescript-eslint/camelcase
              { nf_resize: 'fit', w: 560, h: 320 }
            : false,
        });
      },
    );
  }
  async getLargeMediaDisplayURLs(mediaFiles: { path: string; id?: string }[]) {
    const client = await this.getLargeMediaClient();
    const largeMediaItems = mediaFiles
      .filter(({ path }) => client.matchPath(path))
      .map(({ id, path }) => ({ path, sha: id }));

    const filesPromise = this.backend!.fetchFiles(largeMediaItems);

    return filesPromise
      .then(items =>
        items.map(({ file: { sha }, data }) => {
          const parsedPointerFile = parsePointerFile(data);
          return [
            {
              pointerId: sha,
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
      const largeMediaDisplayURLs = await this.getLargeMediaDisplayURLs([{ path }]);
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

  async getPointerFileForMediaFileObj(fileObj: File) {
    const client = await this.getLargeMediaClient();
    const { name, size } = fileObj;
    const sha = await getBlobSHA(fileObj);
    await client.uploadResource({ sha, size }, fileObj);
    const pointerFileString = createPointerFile({ sha, size });
    const pointerFileBlob = new Blob([pointerFileString]);
    const pointerFile = new File([pointerFileBlob], name, { type: 'text/plain' });
    const pointerFileSHA = await getBlobSHA(pointerFile);
    return {
      file: pointerFile,
      blob: pointerFileBlob,
      sha: pointerFileSHA,
      raw: pointerFileString,
    };
  }

  async persistEntry(entry: Entry, mediaFiles: AssetProxy[], options: PersistOptions) {
    const client = await this.getLargeMediaClient();
    if (!client.enabled) {
      return this.backend!.persistEntry(entry, mediaFiles, options);
    }

    const largeMediaFilteredMediaFiles = await Promise.all(
      mediaFiles.map(async mediaFile => {
        const { fileObj, path } = mediaFile;
        const fixedPath = path.startsWith('/') ? path.slice(1) : path;
        if (!client.matchPath(fixedPath)) {
          return mediaFile;
        }

        const pointerFileDetails = await this.getPointerFileForMediaFileObj(fileObj as File);
        return {
          ...mediaFile,
          fileObj: pointerFileDetails.file,
          size: pointerFileDetails.blob.size,
          sha: pointerFileDetails.sha,
          raw: pointerFileDetails.raw,
        };
      }),
    );

    return this.backend!.persistEntry(entry, largeMediaFilteredMediaFiles, options);
  }

  async persistMedia(mediaFile: AssetProxy, options: PersistOptions) {
    const { fileObj, path } = mediaFile;
    const displayURL = URL.createObjectURL(fileObj);
    const client = await this.getLargeMediaClient();
    const fixedPath = path.startsWith('/') ? path.slice(1) : path;
    if (!client.enabled || !client.matchPath(fixedPath)) {
      return this.backend!.persistMedia(mediaFile, options);
    }

    const pointerFileDetails = await this.getPointerFileForMediaFileObj(fileObj as File);
    const persistMediaArgument = {
      fileObj: pointerFileDetails.file,
      size: pointerFileDetails.blob.size,
      path,
      sha: pointerFileDetails.sha,
      raw: pointerFileDetails.raw,
    };
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
  unpublishedEntry(collection: Collection, slug: string) {
    return this.backend!.unpublishedEntry(collection, slug, {
      loadEntryMediaFiles: files => this.loadEntryMediaFiles(files),
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
  traverseCursor(cursor: CursorType, action: string) {
    return (this.backend as GitLabBackend | BitbucketBackend).traverseCursor!(cursor, action);
  }
}
