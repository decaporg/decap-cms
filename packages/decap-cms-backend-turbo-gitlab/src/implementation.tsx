import { GitLabBackend } from 'decap-cms-backend-gitlab';
import API from 'decap-cms-backend-gitlab/src/API';
import { unsentRequest, type Config, type User, type Credentials, filterByExtension } from 'decap-cms-lib-util';
import { stripIndent } from 'common-tags';

import { SupabaseClient } from './supabase';
import SupabaseAuthenticationPage from './AuthenticationPage';
import { resolveCommitAuthorFromSupabaseUser } from './commitAuthor';
import { recordCmsEvent } from './telemetry';

interface SupabaseUser extends User {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user_name?: string;
  user_email?: string;
  email?: string;
  user_metadata?: {
    active_site_id?: string;
    display_name?: string;
    full_name?: string;
    name?: string;
  };
}

type SupabaseRefreshError = Error & {
  status?: number;
  code?: string;
  isTerminal?: boolean;
};

// Fake GitLab user shape returned by currentUser/authenticate — this backend
// never has a real GitLab identity for the CMS user (see /gl/user's
// synthesized response on the server side, which this mirrors).
type GitLabUser = {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};

const REFRESH_BUFFER_SECONDS = 300;
const REFRESH_RETRY_ATTEMPTS = 3;

// See decap-cms-backend-turbo-github's implementation.tsx for the GitHub-flavored
// twin of this — same rationale: shared control-plane values are identical
// across every site, so a site's config.yml only needs `turbo_site_id`.
const DEFAULT_CONFIG_ENDPOINT = 'https://sb.decapcms.org/functions/v1/config';

export default class DecapTurboGitLabBackend extends GitLabBackend {
  static async preloadConfig(config: Config): Promise<Config> {
    const backend = config.backend as Record<string, unknown>;
    const isFullyManuallyConfigured = Boolean(backend.supabase_app_id && backend.supabase_anon_key);
    if (isFullyManuallyConfigured) {
      return config;
    }

    if (backend.supabase_app_id && !backend.supabase_anon_key) {
      throw new Error(
        "turbo-gitlab config error: 'supabase_app_id' is set without 'supabase_anon_key'. " +
          "Provide both to configure manually, or provide only 'turbo_site_id' to fetch " +
          'both from the control plane.',
      );
    }

    if (!backend.turbo_site_id) {
      return config;
    }

    const endpoint = (backend.turbo_config_url as string) || DEFAULT_CONFIG_ENDPOINT;
    const response = await fetch(
      `${endpoint}?site_id=${encodeURIComponent(backend.turbo_site_id as string)}`,
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(`Failed to load turbo-gitlab site defaults: ${body.error || response.status}`);
    }

    const defaults = await response.json();

    return {
      ...config,
      backend: { ...defaults, ...config.backend },
    };
  }

  supabaseAccessToken: string | null = null;
  supabaseRefreshToken: string | null = null;
  supabaseExpiresAt: number | null = null;
  supabaseAnonKey: string;
  supabaseId: string;
  siteId: string;
  commitAuthorEmailFallback?: string;
  updateUserCredentialsFn: (credentials: Credentials) => void;
  // refreshedTokenPromise is already declared (and typed identically) on the
  // GitLabBackend base class — redeclaring it here would need TypeScript's
  // `declare` modifier, which this repo's Babel-based build doesn't support
  // (no allowDeclareFields), so it's intentionally omitted rather than
  // re-declared.
  reloadEntriesAfterPersist?: boolean;
  _currentUserPromise?: Promise<GitLabUser>;

  supabase: SupabaseClient;

  constructor(config: Config, options: any = {}) {
    super(config, options);

    // See decap-cms-backend-turbo-github's identical guard: GitLab also exposes a
    // separate GraphQL API/schema, and the same tenant-scoping-bypass risk
    // applies — a GraphQL transport here would bypass the x-site-id/site_id
    // scoping this backend adds on top of every REST request via
    // apiRequestFunction.
    if (this.useGraphQL) {
      throw new Error(
        "Decap Turbo GitLab backend does not support 'use_graphql: true' — GraphQL requests would bypass per-site tenant scoping. Remove use_graphql from your config.",
      );
    }

    this.supabaseAnonKey = (config.backend.supabase_anon_key ||
      config.backend.supabase_app_id ||
      '') as string;
    this.supabaseId = (config.backend.supabase_app_id || '') as string;
    this.siteId = (config.backend.turbo_site_id || '') as string;
    this.commitAuthorEmailFallback =
      ((config.backend as Record<string, unknown>).commit_author_email as string | undefined) ||
      ((config.backend as Record<string, unknown>).noreply_email as string | undefined);

    this.updateUserCredentialsFn = options.updateUserCredentials || (() => undefined);
    this.reloadEntriesAfterPersist = true;

    this.supabase = new SupabaseClient(
      `https://${this.supabaseId}.supabase.co/rest/v1/data`,
      this.supabaseAnonKey,
      this.branch,
      this.repo,
      this.siteId,
    );
  }

  // Overrides GitLabBackend's own PKCE-based apiRequestFunction entirely —
  // this backend never obtains a GitLab OAuth token at all (the CMS user's
  // only credential is a Supabase JWT), so there is no `refresh_token` grant
  // to fall back to on a 401 the way the plain GitLab backend does. Instead
  // this injects the same x-site-id header / site_id query param scoping
  // that decap-cms-backend-turbo-github's ghFetch/setScopedApiRequestBuilder add for
  // GitHub, so the shared `gl` Edge Function knows which tenant a request
  // belongs to. The request has already had apiRoot prepended by the time
  // requestFunction runs (see API.buildRequest), so scoping is added here
  // rather than at URL-construction time.
  apiRequestFunction = async (req: any) => {
    const accessToken = this.supabaseAccessToken || this.token || '';
    const isGlProxyRequest = this.apiRoot.includes('/functions/v1/gl');

    let scopedReq = req;
    if (accessToken) {
      scopedReq = unsentRequest.withHeaders({ Authorization: `Bearer ${accessToken}` }, scopedReq);
    }
    if (this.siteId && isGlProxyRequest) {
      scopedReq = unsentRequest.withHeaders({ 'x-site-id': this.siteId }, scopedReq);
      scopedReq = unsentRequest.withParams({ site_id: this.siteId }, scopedReq);
    }

    const response: Response = await unsentRequest.performRequest(scopedReq);
    return response;
  };

  async status() {
    let auth = false;

    if (this.supabaseAccessToken) {
      try {
        const now = Math.floor(Date.now() / 1000);
        const tokenExpiringSoon =
          this.supabaseExpiresAt && this.supabaseExpiresAt - now <= REFRESH_BUFFER_SECONDS;

        if (tokenExpiringSoon && this.supabaseRefreshToken) {
          try {
            await this.getRefreshedAccessToken();
            auth = true;
          } catch (error) {
            const refreshError = error as SupabaseRefreshError;
            auth = !refreshError.isTerminal;
          }
        } else if (!tokenExpiringSoon) {
          auth = true;
        }
      } catch (e) {
        console.warn('Failed checking Supabase auth status', e);
        auth = false;
      }
    }

    return {
      auth: { status: auth },
      api: { status: true, statusPage: '' },
    };
  }

  // Widened to `any`: decap-cms-core only ever forwards whatever this
  // returns to React unchanged (see Backend.authComponent in
  // decap-cms-core/src/backend.ts) — the concrete return type GitLabBackend
  // declares here is an artifact of its own AuthenticationPage's propTypes,
  // not a real contract, and SupabaseAuthenticationPage's props shape
  // legitimately differs (it doesn't need GitLab's OAuth-specific props at
  // all: base_url/siteId/authEndpoint/clearHash).
  authComponent(): any {
    // Unlike decap-cms-backend-turbo-github's GitHub twin, no `backend={this}`
    // injection is needed here — SupabaseAuthenticationPage only ever reads
    // `props.config`/`props.onLogin`, both already supplied by core's
    // standard auth-page render call, so this can return the component
    // directly rather than a wrapping function.
    return SupabaseAuthenticationPage;
  }

  restoreUser(user: User) {
    const supabaseUser = user as SupabaseUser;
    if (supabaseUser.access_token) {
      this.supabaseAccessToken = supabaseUser.access_token;
      this.supabase.setAccessToken(this.supabaseAccessToken);
    }
    if (supabaseUser.refresh_token) {
      this.supabaseRefreshToken = supabaseUser.refresh_token;
    }
    if (supabaseUser.expires_at) {
      this.supabaseExpiresAt = supabaseUser.expires_at;
    }
    return this.authenticate(user);
  }

  async authenticate(state: Credentials) {
    if ('access_token' in state) {
      this.supabaseAccessToken = state.access_token as string;
      this.supabase.setAccessToken(this.supabaseAccessToken);
    }
    if ('refresh_token' in state) {
      this.supabaseRefreshToken = state.refresh_token as string;
    }
    if ('expires_at' in state) {
      this.supabaseExpiresAt = state.expires_at as number;
    }

    const supabaseState = state as SupabaseUser;
    const activeSiteFromState = supabaseState.user_metadata?.active_site_id;
    if (this.siteId && this.supabaseAccessToken && activeSiteFromState !== this.siteId) {
      await this.setActiveSiteAndRefresh();
    }

    this.token = state.token as string;

    this.api = new API({
      token: this.token,
      branch: this.branch,
      repo: this.repo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      useGraphQL: false,
      graphQLAPIRoot: this.graphQLAPIRoot,
      requestFunction: this.apiRequestFunction,
    });

    const user = await this.api.user();
    const isCollab = await this.api.hasWriteAccess().catch((error: Error) => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If your project is under a group, ensure the group's access token has been granted to this project.
      `;
      throw error;
    });

    if (!isCollab) {
      throw new Error('The configured GitLab access token does not have write access to this project.');
    }

    if (!this.isBranchConfigured) {
      const defaultBranch = await this.api.getDefaultBranch().catch(() => null);
      if (defaultBranch?.name) {
        this.branch = defaultBranch.name;
      }
    }

    this.api.commitAuthor = resolveCommitAuthorFromSupabaseUser(
      state as SupabaseUser,
      this.commitAuthorEmailFallback,
    );

    // Only knowable post-auth (the `config` bootstrap endpoint's static
    // preloadConfig hook runs before a user JWT exists), so it's fetched
    // here and attached to the returned user rather than resolved earlier.
    // decap-cms-core's actions/auth.ts picks up `permissions` off this object
    // generically (the field name is backend-neutral by design — any backend
    // could set it) and re-filters the loaded config against it.
    const turboPermissions = await this.fetchTurboPermissions();

    recordCmsEvent(this.baseUrl!, this.supabaseAnonKey, this.supabaseAccessToken, 'cms_session_started', this.siteId);

    return {
      ...user,
      login: user.username,
      token: state.token as string,
      ...('access_token' in state && { access_token: state.access_token }),
      ...('refresh_token' in state && { refresh_token: state.refresh_token }),
      ...('expires_at' in state && { expires_at: state.expires_at }),
      ...('user_name' in state && { user_name: (state as SupabaseUser).user_name }),
      ...('user_email' in state && { user_email: (state as SupabaseUser).user_email }),
      ...('email' in state && { email: (state as SupabaseUser).email }),
      ...('user_metadata' in state && { user_metadata: (state as SupabaseUser).user_metadata }),
      ...(turboPermissions && { permissions: turboPermissions }),
    };
  }

  async fetchTurboPermissions(): Promise<{ collections?: Record<string, string> } | undefined> {
    if (!this.supabaseAccessToken || !this.siteId) {
      return undefined;
    }

    try {
      const res = await fetch(
        `${this.baseUrl}/functions/v1/permissions?site_id=${encodeURIComponent(this.siteId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.supabaseAccessToken}`,
            apikey: this.supabaseAnonKey,
          },
        },
      );
      if (!res.ok) {
        console.warn('Failed to fetch Turbo site permissions', res.status);
        return undefined;
      }
      return await res.json();
    } catch (error) {
      console.warn('Failed to fetch Turbo site permissions', error);
      return undefined;
    }
  }

  async setActiveSiteAndRefresh() {
    if (!this.supabaseAccessToken || !this.siteId) {
      return;
    }

    const updateResponse = await fetch(`https://${this.supabaseId}.supabase.co/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.supabaseAnonKey,
        Authorization: `Bearer ${this.supabaseAccessToken}`,
      },
      body: JSON.stringify({
        data: {
          active_site_id: this.siteId,
        },
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to set active_site_id in Supabase user metadata');
    }

    await this.getRefreshedAccessToken();
  }

  isOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  isTerminalRefreshFailure(status?: number, code?: string) {
    if (status === 401) {
      return true;
    }
    if (status === 400 && ['invalid_grant', 'invalid_refresh_token'].includes(String(code))) {
      return true;
    }
    return false;
  }

  isRetryableStatus(status?: number) {
    if (!status) {
      return true;
    }
    if (status === 408 || status === 429) {
      return true;
    }
    return status >= 500;
  }

  async delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchSupabaseRefreshToken() {
    if (!this.supabaseRefreshToken) {
      const noTokenError = new Error('No refresh token available') as SupabaseRefreshError;
      noTokenError.isTerminal = true;
      throw noTokenError;
    }

    const response = await fetch(
      `https://${this.supabaseId}.supabase.co/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey,
        },
        body: JSON.stringify({
          refresh_token: this.supabaseRefreshToken,
        }),
      },
    );

    if (!response.ok) {
      let errorBody: { error_code?: string; error?: string } | undefined;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = undefined;
      }

      const refreshError = new Error('Failed to refresh Supabase token') as SupabaseRefreshError;
      refreshError.status = response.status;
      refreshError.code = errorBody?.error_code || errorBody?.error;
      refreshError.isTerminal = this.isTerminalRefreshFailure(
        refreshError.status,
        refreshError.code,
      );
      throw refreshError;
    }

    return response.json();
  }

  // Overrides GitLabBackend's own getRefreshedAccessToken (PKCE-based, tied
  // to a real GitLab OAuth grant) — this backend refreshes a Supabase
  // session, not a GitLab token, same as decap-cms-backend-turbo-github does for
  // GitHub (which has no refresh concept of its own to override).
  async getRefreshedAccessToken(): Promise<string> {
    if (this.refreshedTokenPromise) {
      return this.refreshedTokenPromise;
    }
    this.refreshedTokenPromise = (async () => {
      let lastError: SupabaseRefreshError | undefined;

      for (let attempt = 1; attempt <= REFRESH_RETRY_ATTEMPTS; attempt++) {
        try {
          const data = await this.fetchSupabaseRefreshToken();

          this.supabaseAccessToken = data.access_token;
          this.supabaseRefreshToken = data.refresh_token;
          this.supabaseExpiresAt = data.expires_at;
          this.supabase.setAccessToken(this.supabaseAccessToken);
          this.token = data.access_token;
          if (this.api) {
            this.api.token = data.access_token;
          }
          this._currentUserPromise = undefined;

          this.updateUserCredentialsFn({
            token: data.access_token,
            refresh_token: data.refresh_token,
            access_token: data.access_token,
            expires_at: data.expires_at,
          } as any);

          return data.access_token;
        } catch (error) {
          const refreshError = error as SupabaseRefreshError;
          if (typeof refreshError.isTerminal !== 'boolean') {
            refreshError.isTerminal = this.isOffline()
              ? false
              : !this.isRetryableStatus(refreshError.status);
          }

          lastError = refreshError;
          const canRetry = !refreshError.isTerminal && attempt < REFRESH_RETRY_ATTEMPTS;
          if (!canRetry) {
            break;
          }

          await this.delay(250 * attempt);
        }
      }

      throw lastError || new Error('Failed to refresh Supabase token');
    })()
      .catch((error: Error) => {
        const refreshError = error as SupabaseRefreshError;
        if (typeof refreshError.isTerminal !== 'boolean') {
          refreshError.isTerminal = false;
        }
        throw refreshError;
      })
      .finally(() => {
        this.refreshedTokenPromise = undefined;
      });

    return this.refreshedTokenPromise;
  }

  shouldForceLogoutOnRefreshFailure(error: unknown) {
    const refreshError = error as SupabaseRefreshError;
    return Boolean(refreshError?.isTerminal);
  }

  getRefreshFailureMessage(error: unknown) {
    if (this.shouldForceLogoutOnRefreshFailure(error)) {
      return 'Session expired. Please log in again.';
    }
    if (this.isOffline()) {
      return 'Unable to refresh session while offline. Please reconnect and retry.';
    }
    return 'Unable to refresh session right now. Please retry in a moment.';
  }

  async refreshSessionIfNeeded() {
    const now = Math.floor(Date.now() / 1000);
    if (!this.supabaseExpiresAt || this.supabaseExpiresAt - now >= REFRESH_BUFFER_SECONDS) {
      return;
    }

    try {
      await this.getRefreshedAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      if (this.shouldForceLogoutOnRefreshFailure(error)) {
        this.logout();
        throw new Error(this.getRefreshFailureMessage(error));
      }
    }
  }

  async currentUser({ token }: { token: string } = { token: this.token || '' }): Promise<GitLabUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        await this.refreshSessionIfNeeded();

        const owner = this.repo.split('/')[0];

        return {
          id: 0,
          name: owner,
          username: owner,
          avatar_url: null,
          token,
          access_token: this.supabaseAccessToken || undefined,
          refresh_token: this.supabaseRefreshToken || undefined,
          expires_at: this.supabaseExpiresAt || undefined,
        };
      })();
    }
    return this._currentUserPromise;
  }

  getEntry(path: string) {
    return this.supabase.fetchEntryByPath(path).then(cached => {
      if (cached) {
        return cached;
      }
      return super.getEntry(path);
    });
  }

  async persistEntry(entry: any, options: any = {}) {
    const result = await super.persistEntry(entry, options);
    if (result && entry.dataFiles && entry.dataFiles.length > 0) {
      try {
        const filesToCache = entry.dataFiles.map((file: any) => ({
          path: file.path || file.newPath || file.slug,
          raw: file.raw,
          id: file.id,
        }));
        await this.supabase.updateEntriesAfterSave(filesToCache);
      } catch (error) {
        console.warn('Failed to update cache:', error);
      }
      recordCmsEvent(
        this.baseUrl!,
        this.supabaseAnonKey,
        this.supabaseAccessToken,
        'cms_entry_saved',
        this.siteId,
        { collection: options.collectionName },
      );
    }
    return result;
  }

  filterFile(folder: string, file: { path: string; name: string }, extension: string, depth: number) {
    const fileFolder = file.path.split(folder)[1]?.replace(/^\/+/, '').replace(/\/+$/, '') || '';
    return filterByExtension(file, extension) && fileFolder.split('/').length <= depth;
  }

  async allEntriesByFolder(
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
    searchTerm?: string,
  ) {
    const collection = `${folder}:${extension}:${depth}:${pathRegex?.toString() || 'all'}`;

    const { files: rawFiles } = await this.api!.listFiles(folder, depth > 1);
    const files = rawFiles.filter(
      file =>
        this.filterFile(folder, file, extension, depth) && (!pathRegex || pathRegex.test(file.path)),
    );

    const readFile = (path: string, id: string | null | undefined) =>
      this.api!.readFile(path, id, { parseText: true }) as Promise<string>;

    await this.supabase.validateFiles(collection, files, readFile, this.readFileMetadata.bind(this));

    const entries = await this.supabase.fetchEntries(collection, searchTerm);
    const fileIdToIndex = new Map(files.map((file, index) => [file.id, index]));
    entries.sort((a: any, b: any) => {
      const indexA = fileIdToIndex.get(a.file.id) ?? Number.MAX_SAFE_INTEGER;
      const indexB = fileIdToIndex.get(b.file.id) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });

    return entries;
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    return this.allEntriesByFolder(folder, extension, depth);
  }

  // GitLab's API client has no equivalent of GitHub's readFileMetadata — this
  // fills the same {author, updatedOn} shape via GitLab's Commits API,
  // failing open (empty strings) exactly like GitHub's version does, since
  // this is display-only metadata and must never block a folder listing.
  async readFileMetadata(path: string): Promise<{ author: string; updatedOn: string }> {
    try {
      const commits = await this.api!.requestJSON({
        url: `${this.api!.repoURL}/repository/commits`,
        params: { path, ref_name: this.branch },
      });
      const commit = commits?.[0];
      return {
        author: commit?.author_name || commit?.author_email || '',
        updatedOn: commit?.authored_date || '',
      };
    } catch {
      return { author: '', updatedOn: '' };
    }
  }
}
