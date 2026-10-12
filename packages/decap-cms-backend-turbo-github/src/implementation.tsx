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
  /**
   * Every request to Turbo's own routes goes through this: it carries the
   * session, the x-site-id scoping and the save meter.
   */
  ghFetch: ScopedFetch;
  /**
   * Non-null only while a save is in flight. Every proxied response is folded
   * into it, so `cms_entry_saved` can report how many round trips that one save
   * cost and how much of the wait was GitHub's own time. Null the rest of the
   * time, so ordinary reads are not counted.
   */
  proxyMeter: ProxyMeter | null = null;

  /**
   * Joins concurrent identical reads. One per backend instance, so every read
   * path — the proxied GitHub API via `requestFunction` and this backend's own
   * `ghFetch` — shares a single view of what is already in flight.
   */
  protected coalesceRequest: RequestCoalescer = createRequestCoalescer();

  /**
   * The server's search covers entry bodies, so core keeps the body in its
   * own pass rather than filtering those matches back out.
   */
  searchesEntryBody = true;

  editorBridgeEnabled = false;
  editorBridgeInstance: EditorBridge | null = null;

  /**
   * Lazily built, because most of a session never saves anything and a site
   * with no deploy hook never needs one at all.
   */
  private deployWatcherInstance: DeployWatcher | null = null;

  /**
   * The commit the last save produced, and the entry it saved. Core awaits
   * `persistEntry` without reading its return value, so this is the only place
   * the new sha can be captured — and the sha is what the deploy ledger keys
   * on. Null after a save that produced no sha (the REST fallback path), so a
   * save can never be recorded against a previous save's commit.
   */
  lastSavedCommit: { sha: string; entryPath?: string } | null = null;

  /** Whether editors see deploy status at all, and which host counts (§A7). */
  private deployStatusOptions: DeployStatusOptions = parseDeployStatusOptions(undefined);

  constructor(config: Config, options: any = {}) {
    super(config, options);

    // GraphQLAPI (used when use_graphql is set) builds its own Apollo
    // transport directly off the constructor config and never goes through
    // setScopedApiRequestBuilder's patched urlFor/requestHeaders below — so
    // every GraphQL request would silently skip the x-site-id/site_id
    // scoping the shared `gh` Edge Function relies on to know which
    // tenant a request belongs to. Rather than retrofit Apollo's transport
    // with scoping, reject the combination outright: nothing currently
    // configures use_graphql for this backend, so this can't regress an
    // existing site.
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
    // The editor bridge (editorBridge.ts) is still in development, so a site
    // opts in with `editor_bridge: true`. On by default it would show its badge
    // and "Ask Claude" on every entry, and upload every editor's unsaved draft
    // to Turbo every few seconds, whether or not an agent is connected.
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
      // The sync costs 1.4s even when it has nothing to do, so the read is
      // issued alongside it and kept when the server says nothing changed.
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

    // lib-util's requestWithBackoff reads `api.requestFunction` off the
    // instance and falls back to unsentRequest.performRequest, so this is the
    // one place every API request's Response passes through — urlFor and
    // requestHeaders above only see the request side. Scoping is already
    // applied by the time this runs.
    //
    // Two things hang off that: the save meter observes every response, and
    // concurrent identical reads are folded into one round trip. Both belong
    // here rather than further out because this is the only funnel that sees
    // the final, fully scoped URL.
    //
    // `recordProxyResponse` sits inside the coalesced work, not outside it, so
    // the meter counts round trips actually made — a joined duplicate should
    // not inflate a save's request count.
    //
    // Cast because the hook is declared on lib-util's API interface (and read
    // there) but not redeclared on decap-cms-backend-github's own API class —
    // the same reason turbo-gitlab can assign it directly and this cannot.
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

    // Paginated reads (the editorial-workflow board's pull request list among
    // them) go through lib-util's getAllResponses, which calls performRequest
    // directly and never reaches requestFunction. Every page still passes
    // through parseResponse, so the session-ending answers are caught there;
    // they are not retried, but the latch stops whatever would follow.
    // GitHub's handleRequestError reads `message`; a proxy refusal carries its
    // reason in `error`, which used to leave the editor with an empty toast.
    const originalHandleRequestError = api.handleRequestError.bind(api);
    api.handleRequestError = (error: { message?: string; error?: unknown }, status: number) =>
      originalHandleRequestError(
        (!error?.message && typeof error?.error === 'string'
          ? { ...error, message: error.error }
          : error) as never,
        status,
      );

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

  /**
   * The Turbo session lives on this instance, not only in the auth store core
   * clears — GitHubBackend.logout knows nothing about Supabase. Without this,
   * a logged-out CMS kept a usable access token (`status()` would keep
   * reporting `auth: true`), a Supabase client still sending it, a memoised
   * `currentUser`, and a live deploy subscription.
   */
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

    // TurboAPI in place of decap-cms-backend-github's API: it commits through
    // `_content/commit` (one request instead of N+4) and falls back to the
    // inherited REST sequence for renames, editorial workflow, oversized
    // payloads, and edge functions that predate the endpoint. See
    // decap-turbo/docs/deploy-status-plan.md §B1.
    this.api = new TurboAPI({
      // The commit request inherits the session refresh, the x-site-id scoping
      // and the save meter that every other Turbo request already goes through.
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

    // GitHubBackend builds this in its own `authenticate`, which this override
    // replaces wholesale - without it the notes pane has nothing watching the
    // thread and another editor's note never appears. Rebuilt rather than
    // reused, so a second login on the same instance cannot leave the previous
    // session's manager polling with the previous session's api.
    this.pollingManager?.destroy();
    this.unwatchFunctions.clear();
    this.pollingManager = new NotesPollingManager(this.api, 15000);

    // GitHubBackend.authenticate calls `api.hasWriteAccess()` here, which is a
    // `GET /repos/{owner}/{repo}` read of `permissions.push` for the signed-in
    // GitHub user. Turbo has no signed-in GitHub user: it commits with the
    // organization's App installation token, which is exactly why
    // `bypassWriteAccessCheckForAppTokens` is set in the constructor — the
    // answer was already being thrown away. The permissions read below is
    // what actually decides what this editor may touch.
    //
    // So it was a round trip whose result nothing read, sitting on the critical
    // path of every CMS load, ahead of the first content request: measured at
    // 1.8s through the gh proxy on the tester site. Its other upstream side
    // effect — normalising `repoOwner` to GitHub's casing — Turbo does not need
    // either, because `preloadConfig` takes repo from the authoritative `sites`
    // row rather than from a hand-written config.yml.
    //
    // `currentUser` is local (session identity, no fetch), so pairing it with
    // the permissions read costs nothing and overlaps their latency.
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
      // API.user() narrows currentUser's result to { name, login, email } and
      // drops the avatar — but this object is what core stores and the header
      // renders, so put it back.
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
   * Notes written by others show initials rather than an avatar, because the
   * only avatar the thread carries is the App's. Dropping it here keeps a note
   * looking the same before and after a reload - otherwise the one just
   * written showed the editor's own avatar until the thread was re-read.
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

    // Assigned on every save, including to null: only the one-call commit
    // endpoint (§B1) returns a sha, and leaving the previous one in place
    // would have a REST-fallback save watch the deploy of the save before it.
    //
    // The branch has to match too. An editorial-workflow save commits to the
    // entry's own `cms/...` branch, and that commit will never appear in a
    // deploy of the site's branch — so watching it would leave the editor
    // waiting on a deploy that is never coming. An unpublished entry is not
    // going live, and "Entry saved" is the honest thing to say about it.
    const sha = (result as { sha?: unknown } | undefined)?.sha;
    const committedBranch = (result as { branch?: unknown } | undefined)?.branch;
    this.lastSavedCommit =
      typeof sha === 'string' && sha && committedBranch === this.branch
        ? { sha, entryPath: entry.dataFiles?.[0]?.path as string | undefined }
        : null;

    // The API client owns the content key format; the bare key is the
    // fallback for an `api` that is somehow unset, which is unreachable from
    // a real save but must not be the thing that breaks one.
    const branch = savedBranch(result, options, entry, this.branch, (collection, slug) =>
      this.api
        ? this.api.generateContentKey(collection, slug)
        : generateContentKey(collection, slug),
    );
    recordSaveEvent(this.telemetryTarget(), entry, options, { ...save, branch });
    return result;
  }

  /**
   * Whether `head` contains `base` — the question "is my change in this
   * deploy?", asked of git rather than of two clocks. See
   * decap-turbo/docs/deploy-status-plan.md §A4b.
   *
   * Only reached when a successful deploy names a commit that is not one of
   * ours, which is exactly the case where a host cancelled our build in
   * favour of a newer commit and shipped our change inside it.
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
   * The site's deploy watcher, or null when this backend cannot read
   * deployments at all (no Supabase project or site id configured).
   *
   * Built once and shared: it holds one ledger of this editor's unpublished
   * saves for the whole session, not one watch per save.
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
        // A watch outlives several session refreshes, so the token is read per
        // request rather than captured here.
        getAccessToken: () => this.session.accessToken,
        isCommitContained: (base, head) => this.isCommitContained(base, head),
      });
    }

    return this.deployWatcherInstance;
  }

  /**
   * Subscribes to "this change is live / this build failed" for the whole
   * session, and resumes any ledger left over from a previous page load.
   *
   * Returns an unsubscribe function, or null when this backend cannot watch
   * deploys — the caller's cue that no deploy notification will ever arrive.
   */
  subscribeDeployResolutions(
    listener: (resolution: DeployResolution) => void,
  ): (() => void) | null {
    if (!this.deployStatusOptions.notifications) {
      return null;
    }
    return this.deployWatcher()?.subscribe(listener) ?? null;
  }

  /** What the header pill renders. Never starts a poll — see §A8. */
  subscribeDeployStatus(listener: (status: WatchStatus) => void): (() => void) | null {
    if (!this.deployStatusOptions.enabled) {
      return null;
    }
    return this.deployWatcher()?.subscribeStatus(listener) ?? null;
  }

  deployStatusConfig(): DeployStatusConfig {
    // The branch travels with the options so core can scope "Live" without
    // knowing anything about Turbo — it is the same duck-typed contract the
    // rest of this feature uses.
    return { ...this.deployStatusOptions, branch: this.branch ?? null };
  }

  /**
   * Reads the site's recent deploys — the Deploys page, and the single read
   * the app makes on mount so an editor who has saved nothing still sees
   * whether the site is live or broken.
   *
   * Rows are handed to the watcher as well as returned, so the pill and the
   * page cannot disagree about what the latest deploy was.
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
   *
   * Returns false when there is nothing to record — no commit sha (the REST
   * fallback path) or a backend that cannot read deployments. That is the
   * caller's cue to leave today's plain "Entry saved" in place, and it is the
   * common case: most sites never produce a deploy row at all (§A0).
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
   * Where a commit can be read by a human.
   *
   * The Deploys page shows a short sha, and a sha that links to the deployed
   * site is worse than no link at all — it looks like it will show you the
   * change and shows you the home page. This is the honest destination.
   *
   * `apiRoot` is Turbo's edge function rather than GitHub, so it cannot be
   * derived from there; this backend is github.com-only (Enterprise is not
   * supported), so the host is fixed.
   */
  commitUrl(sha: string): string | null {
    if (!sha || !this.originRepo) {
      return null;
    }
    return `https://github.com/${this.originRepo}/commit/${sha}`;
  }
}
