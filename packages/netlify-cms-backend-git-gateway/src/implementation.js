import GoTrue from 'gotrue-js';
import jwtDecode from 'jwt-decode';
import { fromPairs, get, pick, intersection, unzip } from 'lodash';
import ini from 'ini';
import { APIError, getBlobSHA, unsentRequest } from 'netlify-cms-lib-util';
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { BitBucketBackend, API as BitBucketAPI } from 'netlify-cms-backend-bitbucket';
import GitHubAPI from './GitHubAPI';
import GitLabAPI from './GitLabAPI';
import AuthenticationPage from './AuthenticationPage';
import {
  parsePointerFile,
  createPointerFile,
  getLargeMediaPatternsFromGitAttributesFile,
  getClient,
} from './netlify-lfs-client';

const localHosts = {
  localhost: true,
  '127.0.0.1': true,
  '0.0.0.0': true,
};
const defaults = {
  identity: '/.netlify/identity',
  gateway: '/.netlify/git',
  largeMedia: '/.netlify/large-media',
};

function getEndpoint(endpoint, netlifySiteURL) {
  if (
    localHosts[document.location.host.split(':').shift()] &&
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

export default class GitGateway {
  constructor(config, options = {}) {
    this.options = {
      proxied: true,
      API: null,
      ...options,
    };
    this.config = config;
    this.branch = config.getIn(['backend', 'branch'], 'master').trim();
    this.squash_merges = config.getIn(['backend', 'squash_merges']);

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

  requestFunction = req =>
    this.tokenPromise()
      .then(token => unsentRequest.withHeaders({ Authorization: `Bearer ${token}` }, req))
      .then(unsentRequest.performRequest);

  authenticate(user) {
    this.tokenPromise = user.jwt.bind(user);
    return this.tokenPromise().then(async token => {
      if (!this.backendType) {
        const { github_enabled, gitlab_enabled, bitbucket_enabled, roles } = await fetch(
          `${this.gatewayUrl}/settings`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ).then(async res => {
          const contentType = res.headers.get('Content-Type');
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
        if (github_enabled) {
          this.backendType = 'github';
        } else if (gitlab_enabled) {
          this.backendType = 'gitlab';
        } else if (bitbucket_enabled) {
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
        name: user.user_metadata.full_name || user.email.split('@').shift(),
        email: user.email,
        avatar_url: user.user_metadata.avatar_url,
        metadata: user.user_metadata,
      };
      const apiConfig = {
        api_root: `${this.gatewayUrl}/${this.backendType}`,
        branch: this.branch,
        tokenPromise: this.tokenPromise,
        commitAuthor: pick(userData, ['name', 'email']),
        squash_merges: this.squash_merges,
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
        this.backend = new BitBucketBackend(this.config, { ...this.options, API: this.api });
      }

      if (!(await this.api.hasWriteAccess())) {
        throw new Error("You don't have sufficient permissions to access Netlify CMS");
      }
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
    return this.tokenPromise();
  }

  entriesByFolder(collection, extension) {
    return this.backend.entriesByFolder(collection, extension);
  }
  entriesByFiles(collection) {
    return this.backend.entriesByFiles(collection);
  }
  fetchFiles(files) {
    return this.backend.fetchFiles(files);
  }
  getEntry(collection, slug, path) {
    return this.backend.getEntry(collection, slug, path);
  }

  getMedia() {
    return Promise.all([this.backend.getMedia(), this.getLargeMediaClient()]).then(
      async ([mediaFiles, largeMediaClient]) => {
        if (!largeMediaClient.enabled) {
          return mediaFiles;
        }
        const largeMediaURLThunks = await this.getLargeMedia(mediaFiles);
        return mediaFiles.map(({ id, url, urlIsPublicPath, getDisplayURL, ...rest }) => ({
          ...rest,
          id,
          url,
          urlIsPublicPath: largeMediaURLThunks[id] ? false : urlIsPublicPath,
          getDisplayURL: largeMediaURLThunks[id]
            ? largeMediaURLThunks[id]
            : getDisplayURL || (url && (() => Promise.resolve(url))),
        }));
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
    const netlifyLargeMediaEnabledPromise = this.api
      .readFile('.lfsconfig')
      .then(ini.decode)
      .then(({ lfs: { url } }) => new URL(url))
      .then(lfsURL => ({ enabled: lfsURL.hostname.endsWith('netlify.com') }))
      .catch(err => ({ enabled: false, err }));

    const lfsPatternsPromise = this.api
      .readFile('.gitattributes')
      .then(getLargeMediaPatternsFromGitAttributesFile)
      .then(patterns => ({ patterns }))
      .catch(err => (err.message.includes('404') ? [] : { err }));

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
            ? { nf_resize: 'fit', w: 280, h: 160 }
            : false,
        });
      },
    );
  }
  getLargeMedia(mediaFiles) {
    return this.getLargeMediaClient().then(client => {
      const largeMediaItems = mediaFiles
        .filter(({ path }) => client.matchPath(path))
        .map(({ id, path }) => ({ path, sha: id }));
      return this.backend
        .fetchFiles(largeMediaItems)
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
        .then(async ([idMaps, files]) => [
          idMaps,
          await client.getResourceDownloadURLThunks(files).then(fromPairs),
        ])
        .then(([idMaps, resourceMap]) =>
          idMaps.map(({ pointerId, resourceId }) => [pointerId, resourceMap[resourceId]]),
        )
        .then(fromPairs);
    });
  }
  persistEntry(entry, mediaFiles, options) {
    return this.backend.persistEntry(entry, mediaFiles, options);
  }
  persistMedia(mediaFile, options) {
    const { fileObj, path, value } = mediaFile;
    const { name, size } = fileObj;
    return this.getLargeMediaClient().then(client => {
      const fixedPath = path.startsWith('/') ? path.slice(1) : path;
      if (!client.enabled || !client.matchPath(fixedPath)) {
        return this.backend.persistMedia(mediaFile, options);
      }

      return getBlobSHA(fileObj).then(async sha => {
        await client.uploadResource({ sha, size }, fileObj);
        const pointerFileString = createPointerFile({ sha, size });
        const pointerFileBlob = new Blob([pointerFileString]);
        const pointerFile = new File([pointerFileBlob], name, { type: 'text/plain' });
        const pointerFileSHA = await getBlobSHA(pointerFile);
        const persistMediaArgument = {
          fileObj: pointerFile,
          size: pointerFileBlob.size,
          path,
          sha: pointerFileSHA,
          raw: pointerFileString,
          value,
        };
        const persistedMediaFile = await this.backend.persistMedia(persistMediaArgument, options);
        return {
          ...persistedMediaFile,
          urlIsPublicPath: false,
        };
      });
    });
  }
  deleteFile(path, commitMessage, options) {
    return this.backend.deleteFile(path, commitMessage, options);
  }
  getDeployPreview(collection, slug) {
    if (this.backend.getDeployPreview) {
      return this.backend.getDeployPreview(collection, slug);
    }
  }
  unpublishedEntries() {
    return this.backend.unpublishedEntries();
  }
  unpublishedEntry(collection, slug) {
    return this.backend.unpublishedEntry(collection, slug);
  }
  updateUnpublishedEntryStatus(collection, slug, newStatus) {
    return this.backend.updateUnpublishedEntryStatus(collection, slug, newStatus);
  }
  deleteUnpublishedEntry(collection, slug) {
    return this.backend.deleteUnpublishedEntry(collection, slug);
  }
  publishUnpublishedEntry(collection, slug) {
    return this.backend.publishUnpublishedEntry(collection, slug);
  }
  traverseCursor(cursor, action) {
    return this.backend.traverseCursor(cursor, action);
  }
}
