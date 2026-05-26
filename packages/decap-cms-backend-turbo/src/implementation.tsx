import { GitHubBackend } from 'decap-cms-backend-github';
import {
  type Config,
  type User,
  type Credentials,
  type ApiRequest,
  filterByExtension,
  unsentRequest,
} from 'decap-cms-lib-util';
import React from 'react';
import API from 'decap-cms-backend-github/src/API';
import GraphQLAPI from 'decap-cms-backend-github/src/GraphQLAPI';
import { stripIndent } from 'common-tags';

import { SupabaseClient } from './supabase';
import SupabaseAuthenticationPage from './AuthenticationPage';
import { resolveCommitAuthorFromSupabaseUser } from './commitAuthor';

import type { GitHubUser } from 'decap-cms-backend-github/src/implementation';

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

const REFRESH_BUFFER_SECONDS = 300;
const REFRESH_RETRY_ATTEMPTS = 3;

export default class DecapTurboBackend extends GitHubBackend {
  supabaseAccessToken: string | null = null;
  supabaseRefreshToken: string | null = null;
  supabaseExpiresAt: number | null = null;
  supabaseAnonKey: string;
  supabaseId: string;
  siteId: string;
  commitAuthorEmailFallback?: string;
  updateUserCredentials: (credentials: Credentials) => void;
  refreshedTokenPromise?: Promise<string>;

  supabase: SupabaseClient;

  constructor(config: Config, options: any = {}) {
    super(config, options);
    this.supabaseAnonKey = (config.backend.anon_key || config.backend.app_id || '') as string;
    this.supabaseId = (config.backend.app_id || '') as string;
    this.siteId = (config.backend.site_id || '') as string;
    this.commitAuthorEmailFallback =
      ((config.backend as Record<string, unknown>).commit_author_email as string | undefined) ||
      ((config.backend as Record<string, unknown>).noreply_email as string | undefined);

    this.updateUserCredentials = options.updateUserCredentials || (() => {});

    this.bypassWriteAccessCheckForAppTokens = true;
    this.tokenKeyword = 'Bearer';

    this.supabase = new SupabaseClient(
      `https://${this.supabaseId}.supabase.co/rest/v1/data`,
      this.supabaseAnonKey,
      this.branch,
      this.originRepo,
      this.siteId,
    );
  }

  async ghFetch(url: string, init: RequestInit = {}) {
    const accessToken = this.supabaseAccessToken || this.token || '';
    const headers: Record<string, string> = Object.fromEntries(
      new Headers(init.headers || {}).entries(),
    );

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let scopedUrl = url;
    const isGhProxyRequest = scopedUrl.includes('/functions/v1/gh');
    if (this.siteId && isGhProxyRequest) {
      headers['x-site-id'] = this.siteId;
      const urlObj = new URL(scopedUrl);
      if (!urlObj.searchParams.has('site_id')) {
        urlObj.searchParams.set('site_id', this.siteId);
      }
      scopedUrl = urlObj.toString();
    }

    return fetch(scopedUrl, {
      ...init,
      headers,
    });
  }

  setScopedApiRequestBuilder() {
    if (!this.api) {
      return;
    }

    const originalBuildRequest = this.api.buildRequest.bind(this.api);
    this.api.buildRequest = (req: ApiRequest) => {
      const builtRequest = originalBuildRequest(req);
      if (!this.siteId) {
        return builtRequest;
      }

      if (typeof builtRequest === 'string') {
        const isGhProxyRequest = builtRequest.includes('/functions/v1/gh');
        if (!isGhProxyRequest) {
          return builtRequest;
        }
        const urlObj = new URL(builtRequest);
        if (!urlObj.searchParams.has('site_id')) {
          urlObj.searchParams.set('site_id', this.siteId);
        }
        return urlObj.toString();
      }

      const requestUrl = unsentRequest.toURL(builtRequest);
      const isGhProxyRequest = requestUrl.includes('/functions/v1/gh');
      if (!isGhProxyRequest) {
        return builtRequest;
      }

      return unsentRequest.withParams({ site_id: this.siteId })(
        unsentRequest.withHeaders({ 'x-site-id': this.siteId })(builtRequest),
      );
    };
  }

  async status() {
    // Check Supabase authentication status
    let auth = false;

    if (this.supabaseAccessToken) {
      // Try to verify the token is still valid by checking if we can get user info
      try {
        const now = Math.floor(Date.now() / 1000);
        const tokenExpiringSoon =
          this.supabaseExpiresAt && this.supabaseExpiresAt - now <= REFRESH_BUFFER_SECONDS;

        if (tokenExpiringSoon && this.supabaseRefreshToken) {
          // Try to refresh if expired
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

    // Get parent GitHub API status
    const parentStatus = await super.status();

    return {
      auth: { status: auth },
      api: parentStatus.api,
    };
  }

  authComponent() {
    const wrappedAuthenticationPage = (props: Record<string, unknown>) => {
      const allProps = { ...props, backend: this };
      return <SupabaseAuthenticationPage {...allProps} />;
    };
    wrappedAuthenticationPage.displayName = 'AuthenticationPage';
    return wrappedAuthenticationPage;
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

    if (!this.isBranchConfigured) {
      const repoInfo = await this.ghFetch(`${this.apiRoot}/repos/${this.originRepo}`)
        .then(res => res.json())
        .catch(() => null);
      if (repoInfo && repoInfo.default_branch) {
        this.branch = repoInfo.default_branch;
      }
    }

    const apiCtor = this.useGraphql ? GraphQLAPI : API;
    this.api = new apiCtor({
      token: this.token,
      tokenKeyword: this.tokenKeyword,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      useOpenAuthoring: this.useOpenAuthoring,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      baseUrl: this.baseUrl,
      getUser: this.currentUser.bind(this),
    });
    this.setScopedApiRequestBuilder();

    const user = await this.api!.user();
    const isCollab = await this.api!.hasWriteAccess().catch(error => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If the repo is private, make sure you're logged into a GitHub account with access.

        If your repo is under an organization, ensure the organization has granted access to Decap CMS.
      `;
      throw error;
    });

    if (!isCollab && !this.bypassWriteAccessCheckForAppTokens) {
      throw new Error('Your GitHub user account does not have access to this repo.');
    }

    this.api!.commitAuthor = resolveCommitAuthorFromSupabaseUser(
      state as SupabaseUser,
      this.commitAuthorEmailFallback,
    );

    // Include access_token in the returned user object so it gets stored in auth store
    return {
      ...user,
      token: state.token as string,
      useOpenAuthoring: this.useOpenAuthoring,
      ...('access_token' in state && { access_token: state.access_token }),
      ...('refresh_token' in state && { refresh_token: state.refresh_token }),
      ...('expires_at' in state && { expires_at: state.expires_at }),
      ...('user_name' in state && { user_name: (state as SupabaseUser).user_name }),
      ...('user_email' in state && { user_email: (state as SupabaseUser).user_email }),
      ...('email' in state && { email: (state as SupabaseUser).email }),
      ...('user_metadata' in state && { user_metadata: (state as SupabaseUser).user_metadata }),
    };
  }

  async pollUntilForkExists({ repo }: { repo: string; token: string }) {
    const pollDelay = 250;
    let repoExists = false;
    while (!repoExists) {
      repoExists = await this.ghFetch(`${this.apiRoot}/repos/${repo}`)
        .then(() => true)
        .catch(err => {
          if (err && err.status === 404) {
            console.log('This 404 was expected and handled appropriately.');
            return false;
          } else {
            return Promise.reject(err);
          }
        });
      if (!repoExists) {
        await new Promise(resolve => setTimeout(resolve, pollDelay));
      }
    }
    return Promise.resolve();
  }

  async userIsOriginMaintainer({ username: usernameArg }: { username?: string; token: string }) {
    const username = usernameArg || (await this.currentUser({ token: this.token || '' })).login;
    this._userIsOriginMaintainerPromises = this._userIsOriginMaintainerPromises || {};
    if (!this._userIsOriginMaintainerPromises[username]) {
      this._userIsOriginMaintainerPromises[username] = this.ghFetch(
        `${this.apiRoot}/repos/${this.originRepo}/collaborators/${username}/permission`,
      )
        .then(res => res.json())
        .then(({ permission }) => permission === 'admin' || permission === 'write');
    }
    return this._userIsOriginMaintainerPromises[username];
  }

  async forkExists({ token }: { token: string }) {
    try {
      const currentUser = await this.currentUser({ token });
      const repoName = this.originRepo.split('/')[1];
      const repo = await this.ghFetch(`${this.apiRoot}/repos/${currentUser.login}/${repoName}`, {
        method: 'GET',
      }).then(res => res.json());

      const forkExists =
        repo.fork === true &&
        repo.parent &&
        repo.parent.full_name.toLowerCase() === this.originRepo.toLowerCase();
      return forkExists;
    } catch {
      return false;
    }
  }

  async authenticateWithFork({
    userData,
    getPermissionToFork,
  }: {
    userData: User;
    getPermissionToFork: () => Promise<boolean> | boolean;
  }) {
    if (!this.openAuthoringEnabled) {
      throw new Error('Cannot authenticate with fork; Open Authoring is turned off.');
    }

    const token = userData.token as string;
    this.token = token;

    if (!this.alwaysForkEnabled && (await this.userIsOriginMaintainer({ token }))) {
      this.repo = this.originRepo;
      this.useOpenAuthoring = false;
      return Promise.resolve();
    }

    const currentUser = await this.currentUser({ token });
    const repoName = this.originRepo.split('/')[1];
    this.repo = `${currentUser.login}/${repoName}`;
    this.useOpenAuthoring = true;

    if (await this.forkExists({ token })) {
      return this.ghFetch(`${this.apiRoot}/repos/${this.repo}/merge-upstream`, {
        method: 'POST',
        body: JSON.stringify({
          branch: this.branch,
        }),
      });
    } else {
      await getPermissionToFork();

      const fork = await this.ghFetch(`${this.apiRoot}/repos/${this.originRepo}/forks`, {
        method: 'POST',
      }).then(res => res.json());
      return this.pollUntilForkExists({ repo: fork.full_name, token });
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

          this.updateUserCredentials({
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

  async currentUser({ token }: { token: string }): Promise<GitHubUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        await this.refreshSessionIfNeeded();

        const owner = this.originRepo.split('/')[0];

        return {
          name: owner,
          login: owner,
          avatar_url: `https://github.com/${owner}.png`,
          token,
          access_token: this.supabaseAccessToken || undefined,
          refresh_token: this.supabaseRefreshToken || undefined,
          expires_at: this.supabaseExpiresAt || undefined,
        } as any as GitHubUser;
      })() as any;
    }
    return this._currentUserPromise!;
  }

  async getEntry(path: string) {
    const cached = await this.supabase.fetchEntryByPath(path);
    if (cached) {
      return cached;
    }
    return super.getEntry(path);
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
    }
    return result;
  }

  async allEntriesByFolder(
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
    searchTerm?: string,
  ) {
    const repoURL = this.api!.originRepoURL;
    const collection = `${folder}:${extension}:${depth}:${pathRegex?.toString() || 'all'}`;

    const files = (
      await this.api!.listFiles(folder, {
        repoURL,
        depth,
      })
    ).filter(
      file => (!pathRegex || pathRegex.test(file.path)) && filterByExtension(file, extension),
    );

    const readFile = (path: string, id: string | null | undefined) =>
      this.api!.readFile(path, id, { repoURL }) as Promise<string>;

    await this.supabase.validateFiles(
      collection,
      files,
      readFile,
      this.api!.readFileMetadata.bind(this.api),
    );

    const entries = await this.supabase.fetchEntries(collection, searchTerm);
    const fileIdToIndex = new Map(files.map((file, index) => [file.id, index]));
    entries.sort((a, b) => {
      const indexA = fileIdToIndex.get(a.file.id) ?? Number.MAX_SAFE_INTEGER;
      const indexB = fileIdToIndex.get(b.file.id) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });

    return entries;
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    return this.allEntriesByFolder(folder, extension, depth);
  }
}
