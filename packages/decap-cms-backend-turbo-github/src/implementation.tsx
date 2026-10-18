import { GitHubBackend } from 'decap-cms-backend-github';
import {
  type Config,
  type User,
  type Credentials,
  type Note,
  NotesPollingManager,
  generateContentKey,
  unsentRequest,
} from 'decap-cms-lib-util';
import {
  SupabaseAuthenticationPage,
  SupabaseClient,
  TurboContentCache,
  TurboSession,
  attachEditorBridge,
  coalesceKey,
  createPreloadConfig,
  createRequestCoalescer,
  createScopedFetch,
  meterSave,
  peekBody,
  recordCmsEvent,
  recordProxyResponse,
  recordSaveEvent,
  resolveCommitAuthorFromSupabaseUser,
  savedBranch,
  type EditorAttachArgs,
  type EditorBridge,
  type ProxyMeter,
  type RequestCoalescer,
  type ScopedFetch,
  type SupabaseUser,
  type TelemetryTarget,
} from 'decap-cms-lib-turbo';

import TurboAPI from './API';
import {
  createDeployWatcher,
  createDeploymentLister,
  createCommitLister,
  parseDeployStatusOptions,
  type DeployWatcher,
  type DeployResolution,
  type DeployStatusOptions,
  type DeployStatusConfig,
  type DeploymentRow,
  type CommitRow,
  type WatchStatus,
} from './deployWatcher';

// Derived rather than imported from `decap-cms-backend-github/src/...`: the
// published package ships that directory as TypeScript source, which no
// consumer's bundler is configured to resolve.
type GitHubUser = Awaited<ReturnType<GitHubBackend['currentUser']>>;

const PROXY_MARKER = '/functions/v1/gh';

export default class DecapTurboGitHubBackend extends GitHubBackend {
  static preloadConfig = createPreloadConfig('turbo-github');

  supabaseAnonKey: string;
  supabaseId: string;
  siteId: string;
  commitAuthorEmailFallback?: string;
  reloadEntriesAfterPersist?: boolean;
  session: TurboSession;
  supabase: SupabaseClient;
  cache: TurboContentCache;
  /** Every request to Turbo's own routes: session, x-site-id scoping, save meter. */
  ghFetch: ScopedFetch;
  /** Non-null only while a save is in flight; see `meterSave`. */
  proxyMeter: ProxyMeter | null = null;

  /** One per instance, so `requestFunction` and `ghFetch` join the same in-flight reads. */
  protected coalesceRequest: RequestCoalescer = createRequestCoalescer();

  /** The server's search covers entry bodies, so core need not filter them back out. */
  searchesEntryBody = true;

  editorBridgeEnabled = false;
  editorBridgeInstance: EditorBridge | null = null;

  /** Lazily built: most sessions never save, and many sites have no deploy hook. */
  private deployWatcherInstance: DeployWatcher | null = null;

  /**
   * Core ignores `persistEntry`'s return value, so the sha the deploy ledger
   * keys on is captured here. Null after a save that produced no sha.
   */
  lastSavedCommit: { sha: string; entryPath?: string } | null = null;

  /** Whether editors see deploy status at all, and which host counts. */
  private deployStatusOptions: DeployStatusOptions = parseDeployStatusOptions(undefined);

  constructor(config: Config, options: any = {}) {
    super(config, options);

    // GraphQLAPI's Apollo transport would bypass the per-site scoping below.
    if (this.useGraphql) {
      throw new Error(
        "Decap Turbo backend does not support 'use_graphql: true' — GraphQL requests would bypass per-site tenant scoping. Remove use_graphql from your config.",
      );
    }

    // Every request goes out with the organization's GitHub App token, which
    // can neither fork a repo on an editor's behalf nor commit to one.
    if (this.openAuthoringEnabled) {
      throw new Error(
        "Decap Turbo backend does not support 'open_authoring: true' — Turbo commits with the organization's GitHub App, which cannot fork or commit to an editor's own repository. Remove open_authoring from your config.",
      );
    }

    this.supabaseAnonKey = (config.backend.supabase_anon_key ||
      config.backend.supabase_app_id ||
      '') as string;
    this.supabaseId = (config.backend.supabase_app_id || '') as string;
    this.siteId = (config.backend.turbo_site_id || '') as string;
    // Opt-in while in development: it uploads every editor's unsaved draft to
    // Turbo every few seconds, whether or not an agent is connected.
    this.editorBridgeEnabled = config.backend.editor_bridge === true;
    this.deployStatusOptions = parseDeployStatusOptions(
      (config.backend as Record<string, unknown>).deploy_status,
    );
    this.commitAuthorEmailFallback =
      ((config.backend as Record<string, unknown>).commit_author_email as string | undefined) ||
      ((config.backend as Record<string, unknown>).noreply_email as string | undefined);

    this.bypassWriteAccessCheckForAppTokens = true;
    this.tokenKeyword = 'Bearer';
    this.reloadEntriesAfterPersist = true;

    this.session = new TurboSession({
      supabaseId: this.supabaseId,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      updateUserCredentials: options.updateUserCredentials,
      retrieveUserCredentials: options.retrieveUserCredentials,
      onSessionInvalid: options.onSessionInvalid,
      logout: () => this.logout(),
      onTokensChanged: accessToken => {
        this.supabase.setAccessToken(accessToken);
        this.token = accessToken;
        if (this.api) {
          this.api.token = accessToken ?? '';
        }
        this._currentUserPromise = undefined;
      },
    });

    this.supabase = new SupabaseClient(
      `https://${this.supabaseId}.supabase.co/rest/v1/data`,
      this.supabaseAnonKey,
      this.branch,
      this.originRepo,
      this.siteId,
    );

    this.ghFetch = createScopedFetch({
      proxyMarker: PROXY_MARKER,
      session: this.session,
      getToken: () => this.session.accessToken || this.token || '',
      coalesce: this.coalesceRequest,
      getMeter: () => this.proxyMeter,
    });

    this.cache = new TurboContentCache({
      supabase: this.supabase,
      fetch: (url, init) => this.ghFetch(url, init),
      apiRoot: this.apiRoot,
      getBranch: () => this.branch,
      host: 'GitHub',
      speculativeRead: true,
    });
  }

  setScopedApiRequestBuilder() {
    if (!this.api) {
      return;
    }

    const isGhProxyApiRoot = this.apiRoot.includes(PROXY_MARKER);
    const api = this.api;

    const originalUrlFor = this.api.urlFor.bind(this.api);
    this.api.urlFor = (path: string, options: any) => {
      const builtUrl = originalUrlFor(path, options);
      if (!this.siteId || !isGhProxyApiRoot) {
        return builtUrl;
      }
      const urlObj = new URL(builtUrl);
      if (!urlObj.searchParams.has('site_id')) {
        urlObj.searchParams.set('site_id', this.siteId);
      }
      return urlObj.toString();
    };

    const originalRequestHeaders = this.api.requestHeaders.bind(this.api);
    this.api.requestHeaders = async (headers: Record<string, string> = {}) => {
      if (isGhProxyApiRoot) {
        this.session.assertUsable();
        await this.session.refreshIfNeeded();
        api.token = this.session.accessToken || this.token || '';
      }
      const builtHeaders = await originalRequestHeaders(headers);
      if (!this.siteId || !isGhProxyApiRoot) {
        return builtHeaders;
      }
      return { ...builtHeaders, 'x-site-id': this.siteId };
    };

    // lib-util's requestWithBackoff calls `api.requestFunction`, the only funnel
    // that sees every response and the final scoped URL, so the save meter and
    // the coalescer hang off it; the meter sits inside the coalesced work so a
    // joined duplicate is not counted. Cast because GitHub's API class does not
    // redeclare lib-util's hook.
    const perform = (req: unknown) => {
      const request = req as { get: (key: string) => string | undefined };
      return this.coalesceRequest(
        coalesceKey(request.get('method'), unsentRequest.toURL(req as never)),
        () =>
          (unsentRequest.performRequest(req as never) as Promise<Response>).then(response => {
            recordProxyResponse(this.proxyMeter, response);
            return response;
          }),
      );
    };
    (api as unknown as { requestFunction?: (req: unknown) => Promise<Response> }).requestFunction =
      async req => {
        const response = await perform(req);
        if (response.ok || !isGhProxyApiRoot) return response;
        const body = await peekBody(response);
        const verdict = await this.session.reactToProxyAuthAnswer(response.status, body, false);
        if (verdict !== 'retry') return response;
        // The request was built with the refused token; rebuild its header
        // with the one just refreshed. Not coalesced: it is this caller's.
        const retried = unsentRequest.withHeaders(
          { Authorization: `${this.tokenKeyword} ${this.session.accessToken}` },
          req as never,
        );
        const second = (await unsentRequest.performRequest(retried as never)) as Response;
        recordProxyResponse(this.proxyMeter, second);
        if (!second.ok) {
          const secondBody = await peekBody(second);
          await this.session.reactToProxyAuthAnswer(second.status, secondBody, true);
        }
        return second;
      };

    // GitHub's handleRequestError reads `message`; a proxy refusal carries its
    // reason in `error`.
    const originalHandleRequestError = api.handleRequestError.bind(api);
    api.handleRequestError = (error: { message?: string; error?: unknown }, status: number) =>
      originalHandleRequestError(
        (!error?.message && typeof error?.error === 'string'
          ? { ...error, message: error.error }
          : error) as never,
        status,
      );

    // Paginated reads never reach requestFunction, but every page passes
    // through here, so the session-ending answers are caught (not retried).
    const originalParseResponse = api.parseResponse.bind(api);
    api.parseResponse = async (response: Response) => {
      if (
        !response.ok &&
        isGhProxyApiRoot &&
        (response.status === 403 || response.status === 409)
      ) {
        await this.session.reactToProxyAuthAnswer(response.status, await peekBody(response), true);
      }
      return originalParseResponse(response);
    };
  }

  async status() {
    const auth = await this.session.authStatus();
    const parentStatus = await super.status();

    return {
      auth: { status: auth },
      api: parentStatus.api,
    };
  }

  /** GitHubBackend.logout knows nothing about the Turbo session, bridge or deploy watcher. */
  logout() {
    this.session.clear();
    this.editorBridgeInstance?.stop();
    if (this.deployWatcherInstance) {
      this.deployWatcherInstance.stop();
      this.deployWatcherInstance = null;
    }
    return super.logout();
  }

  attachEditor(args: EditorAttachArgs) {
    attachEditorBridge(this, args, {
      enabled: this.editorBridgeEnabled,
      baseUrl: this.baseUrl,
      supabaseId: this.supabaseId,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      getAccessToken: () => this.session.accessToken,
    });
  }

  // Widened to `any`: core hands the component to React unchanged, and the
  // base type describes GitHub's own wrapper, not a contract.
  authComponent(): any {
    return SupabaseAuthenticationPage;
  }

  restoreUser(user: User) {
    this.session.restore(user);
    return this.authenticate(user);
  }

  async authenticate(state: Credentials) {
    // Idempotent; ticks do nothing until the session has a token.
    this.editorBridgeInstance?.start();
    await this.session.begin(state);

    this.token = state.token as string;

    if (!this.isBranchConfigured) {
      const repoInfo = await this.ghFetch(`${this.apiRoot}/repos/${this.originRepo}`)
        .then(res => res.json())
        .catch(() => null);
      if (repoInfo && repoInfo.default_branch) {
        this.branch = repoInfo.default_branch;
      }
    }

    // TurboAPI commits through `_content/commit` in one request, and falls back
    // to the inherited REST sequence for what that endpoint does not cover.
    this.api = new TurboAPI({
      turboFetch: (url, init) => this.ghFetch(url, init),
      token: this.token,
      tokenKeyword: this.tokenKeyword,
      branch: this.branch,
      repo: this.repo,
      originRepo: this.originRepo,
      apiRoot: this.apiRoot,
      squashMerges: this.squashMerges,
      cmsLabelPrefix: this.cmsLabelPrefix,
      initialWorkflowStatus: this.options.initialWorkflowStatus,
      baseUrl: this.baseUrl,
      getUser: this.currentUser.bind(this),
    });
    this.setScopedApiRequestBuilder();

    // GitHubBackend.authenticate builds this, and this override replaces it.
    // Rebuilt, so a second login cannot leave the old manager polling.
    this.pollingManager?.destroy();
    this.unwatchFunctions.clear();
    this.pollingManager = new NotesPollingManager(this.api, 15000);

    // No `api.hasWriteAccess()`: there is no GitHub user to ask about, and the
    // Turbo permissions read decides what this editor may touch.
    const [user, turboPermissions] = await Promise.all([
      this.api!.user(),
      this.session.fetchPermissions(this.baseUrl!),
    ]);

    this.api!.commitAuthor = resolveCommitAuthorFromSupabaseUser(
      state as SupabaseUser,
      this.commitAuthorEmailFallback,
    );

    recordCmsEvent(
      this.baseUrl!,
      this.supabaseAnonKey,
      this.session.accessToken,
      'cms_session_started',
      this.siteId,
    );

    return {
      ...user,
      // API.user() drops the avatar the header renders.
      avatar_url: this.session.sessionIdentity().avatarUrl,
      // Rejected in the constructor, so never true here.
      useOpenAuthoring: false,
      ...this.session.storedUserFields(state, turboPermissions),
    };
  }

  async getToken(): Promise<string | null> {
    await this.session.refreshIfNeeded();
    return this.session.accessToken || this.token || null;
  }

  async currentUser({ token }: { token: string }): Promise<GitHubUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        await this.session.refreshIfNeeded();

        const owner = this.originRepo.split('/')[0];
        const identity = this.session.sessionIdentity();

        // `login` stays the repo owner: other GitHub code paths treat it as an
        // identifier (fork lookups, unpublished-entry authors), not as a
        // display name. `name`, `email` and the avatar are the human-facing
        // fields, and they name the person rather than the org.
        return {
          name: identity.name || owner,
          login: owner,
          email: identity.email,
          avatar_url: identity.avatarUrl,
          token,
          access_token: this.session.accessToken || undefined,
          refresh_token: this.session.refreshToken || undefined,
          expires_at: this.session.expiresAt || undefined,
        } as any as GitHubUser;
      })() as any;
    }
    return this._currentUserPromise!;
  }

  /**
   * Overrides GitHubBackend's, which reads `currentUser().login` — the repo
   * owner for every editor alike on this backend.
   */
  async noteAuthorIdentity(): Promise<{ author: string; authorId?: string }> {
    return this.session.noteAuthorIdentity();
  }

  /**
   * The thread only carries the App's avatar, so drop it here too and a new
   * note looks the same before and after a reload.
   */
  async addNote(
    collection: string,
    slug: string,
    noteData: Omit<Note, 'id'>,
    entryTitle?: string,
  ): Promise<Note> {
    const note = await super.addNote(collection, slug, noteData, entryTitle);
    return { ...note, avatarUrl: undefined };
  }

  async getEntry(path: string) {
    return this.cache.getEntry(path, () => super.getEntry(path));
  }

  async entriesByFiles(files: { path: string; label?: string }[]) {
    return this.cache.entriesByFiles(files);
  }

  async allEntriesByFolder(
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
    searchTerm?: string,
    localeSiblingRegex?: RegExp,
  ) {
    return this.cache.allEntriesByFolder(
      folder,
      extension,
      depth,
      pathRegex,
      searchTerm,
      localeSiblingRegex,
    );
  }

  async entriesByFolder(folder: string, extension: string, depth: number) {
    return this.allEntriesByFolder(folder, extension, depth);
  }

  private telemetryTarget(): TelemetryTarget {
    return {
      baseUrl: this.baseUrl!,
      anonKey: this.supabaseAnonKey,
      accessToken: this.session.accessToken,
      siteId: this.siteId,
    };
  }

  async persistEntry(entry: any, options: any = {}) {
    const save = await meterSave(this, () => super.persistEntry(entry, options));
    const { result } = save;

    // Assigned on every save, null included, so a fallback save cannot watch
    // the previous save's deploy; and only on the site's branch, because a
    // `cms/...` workflow commit never deploys.
    const sha = (result as { sha?: unknown } | undefined)?.sha;
    const committedBranch = (result as { branch?: unknown } | undefined)?.branch;
    this.lastSavedCommit =
      typeof sha === 'string' && sha && committedBranch === this.branch
        ? { sha, entryPath: entry.dataFiles?.[0]?.path as string | undefined }
        : null;

    // The API client owns the content key format.
    const branch = savedBranch(result, options, entry, this.branch, (collection, slug) =>
      this.api
        ? this.api.generateContentKey(collection, slug)
        : generateContentKey(collection, slug),
    );
    recordSaveEvent(this.telemetryTarget(), entry, options, { ...save, branch });
    return result;
  }

  /**
   * Whether `head` contains `base`: "is my change in this deploy?", asked of
   * git rather than of two clocks.
   */
  private async isCommitContained(base: string, head: string) {
    const response = await this.ghFetch(
      `${this.apiRoot}/repos/${this.originRepo}/compare/${encodeURIComponent(
        base,
      )}...${encodeURIComponent(head)}`,
    );
    const comparison = (await response.json()) as { status?: string };
    return comparison.status === 'ahead' || comparison.status === 'identical';
  }

  /**
   * One ledger of this editor's unpublished saves for the session, or null when
   * deployments cannot be read (no Supabase project or site id).
   */
  private deployWatcher(): DeployWatcher | null {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!baseUrl || !this.siteId || !this.supabaseAnonKey) {
      return null;
    }

    if (!this.deployWatcherInstance) {
      this.deployWatcherInstance = createDeployWatcher({
        baseUrl,
        anonKey: this.supabaseAnonKey,
        siteId: this.siteId,
        branch: this.branch,
        // Read per request: a watch outlives several session refreshes.
        getAccessToken: () => this.session.accessToken,
        isCommitContained: (base, head) => this.isCommitContained(base, head),
      });
    }

    return this.deployWatcherInstance;
  }

  /**
   * Subscribes to "this change is live / this build failed" for the session,
   * resuming any ledger left from a previous load. Null: none will ever arrive.
   */
  subscribeDeployResolutions(
    listener: (resolution: DeployResolution) => void,
  ): (() => void) | null {
    if (!this.deployStatusOptions.notifications) {
      return null;
    }
    return this.deployWatcher()?.subscribe(listener) ?? null;
  }

  /** What the header pill renders. Never starts a poll. */
  subscribeDeployStatus(listener: (status: WatchStatus) => void): (() => void) | null {
    if (!this.deployStatusOptions.enabled) {
      return null;
    }
    return this.deployWatcher()?.subscribeStatus(listener) ?? null;
  }

  deployStatusConfig(): DeployStatusConfig {
    // The branch lets core scope "Live" without knowing about Turbo.
    return { ...this.deployStatusOptions, branch: this.branch ?? null };
  }

  /**
   * The site's recent deploys, for the Deploys page and the read on mount. Also
   * handed to the watcher, so the pill and the page cannot disagree.
   */
  async listDeployments(limit?: number): Promise<DeploymentRow[]> {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!this.deployStatusOptions.enabled || !baseUrl || !this.siteId || !this.supabaseAnonKey) {
      return [];
    }

    const rows = await createDeploymentLister({
      baseUrl,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      branch: this.branch,
      getAccessToken: () => this.session.accessToken,
    })(limit);

    this.deployWatcher()?.observe(rows);
    return rows;
  }

  /**
   * Recent CMS saves, so the Deploys page can name the entry a deploy carried
   * instead of showing a bare sha. Shared across editors and devices, unlike
   * the watcher's ledger.
   */
  async listCommits(limit?: number): Promise<CommitRow[]> {
    const baseUrl = this.baseUrl || (this.supabaseId && `https://${this.supabaseId}.supabase.co`);
    if (!this.deployStatusOptions.enabled || !baseUrl || !this.siteId || !this.supabaseAnonKey) {
      return [];
    }

    return createCommitLister({
      baseUrl,
      anonKey: this.supabaseAnonKey,
      siteId: this.siteId,
      branch: this.branch,
      getAccessToken: () => this.session.accessToken,
    })(limit);
  }

  /**
   * Records the save just made, so the deploy that carries it can be reported.
   * False (no sha, or no deployments to read) leaves the plain "Entry saved".
   */
  recordSaveForDeployWatch(entryLabel?: string, entryUrlPath?: string): boolean {
    const saved = this.lastSavedCommit;
    const watcher = this.deployWatcher();

    if (!saved || !saved.entryPath || !watcher) {
      return false;
    }

    watcher.record({
      entryPath: saved.entryPath,
      entryLabel,
      entryUrlPath,
      commitSha: saved.sha,
    });
    return true;
  }

  /**
   * Where a human can read a commit. `apiRoot` is Turbo's proxy, and this
   * backend is github.com-only, so the host is fixed.
   */
  commitUrl(sha: string): string | null {
    if (!sha || !this.originRepo) {
      return null;
    }
    return `https://github.com/${this.originRepo}/commit/${sha}`;
  }
}
