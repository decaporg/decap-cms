// Imported from the package root, not `decap-cms-backend-gitlab/src/API`:
// jest's moduleNameMapper rewrites any path containing the package name to its
// index, so the deep path resolved to the index's (nonexistent) default export
// and `new API(...)` threw under test - which is why `authenticate` had no
// coverage here at all.
import { GitLabBackend, GitLabNotesAPI, API } from 'decap-cms-backend-gitlab';
import {
  unsentRequest,
  NotesPollingManager,
  type Config,
  type User,
  type Credentials,
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
  exposeProxyError,
  meterSave,
  peekBody,
  recordCmsEvent,
  recordProxyResponse,
  recordSaveEvent,
  resolveCommitAuthorFromSupabaseUser,
  savedBranch,
  sessionEndedResponse,
  type EditorAttachArgs,
  type EditorBridge,
  type ProxyMeter,
  type RequestCoalescer,
  type ScopedFetch,
  type SupabaseUser,
  type TelemetryTarget,
} from 'decap-cms-lib-turbo';
import { stripIndent } from 'common-tags';

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

const PROXY_MARKER = '/functions/v1/gl';

export default class DecapTurboGitLabBackend extends GitLabBackend {
  static preloadConfig = createPreloadConfig('turbo-gitlab');

  supabaseAnonKey: string;
  supabaseId: string;
  siteId: string;
  commitAuthorEmailFallback?: string;
  reloadEntriesAfterPersist?: boolean;
  session: TurboSession;
  supabase: SupabaseClient;
  cache: TurboContentCache;
  /**
   * Plain-fetch counterpart to apiRequestFunction, for Turbo's own `_content/*`
   * routes. Those are not GitLab API calls, so they never pass through
   * decap-cms-backend-gitlab's API client — but they need the same Supabase
   * bearer token and the same x-site-id / site_id scoping the `gl` Edge
   * Function relies on to know which tenant is calling.
   */
  glFetch: ScopedFetch;
  _currentUserPromise?: Promise<GitLabUser>;
  /**
   * Non-null only while a save is in flight. Every proxied response is folded
   * into it, so `cms_entry_saved` can report how many round trips that one save
   * cost and how much of the wait was GitLab's own time. Null the rest of the
   * time, so ordinary reads are not counted.
   */
  proxyMeter: ProxyMeter | null = null;

  /**
   * Joins concurrent identical reads. One per backend instance, so every read
   * path — the proxied GitLab API via `apiRequestFunction` and this backend's
   * own `glFetch` — shares a single view of what is already in flight.
   */
  protected coalesceRequest: RequestCoalescer = createRequestCoalescer();

  /**
   * The server's search covers entry bodies, so core keeps the body in its
   * own pass rather than filtering those matches back out.
   */
  searchesEntryBody = true;

  editorBridgeEnabled = false;
  editorBridgeInstance: EditorBridge | null = null;

  constructor(config: Config, options: any = {}) {
    super(config, options);

    // GitLab also exposes a separate GraphQL API, and a GraphQL transport
    // here would bypass the x-site-id/site_id scoping this backend adds on
    // top of every REST request via apiRequestFunction.
    if (this.useGraphQL) {
      throw new Error(
        "Decap Turbo GitLab backend does not support 'use_graphql: true' — GraphQL requests would bypass per-site tenant scoping. Remove use_graphql from your config.",
      );
    }

    // GitLabBackend has no open authoring to fall back on, so without this the
    // option would be silently ignored rather than refused.
    if (config.backend.open_authoring) {
      throw new Error(
        "Decap Turbo GitLab backend does not support 'open_authoring: true' — Turbo commits with the organization's GitLab connection, which cannot fork or commit to an editor's own project. Remove open_authoring from your config.",
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
    this.commitAuthorEmailFallback =
      ((config.backend as Record<string, unknown>).commit_author_email as string | undefined) ||
      ((config.backend as Record<string, unknown>).noreply_email as string | undefined);
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
      this.repo,
      this.siteId,
    );

    this.glFetch = createScopedFetch({
      proxyMarker: PROXY_MARKER,
      session: this.session,
      getToken: () => this.session.accessToken || this.token || '',
      coalesce: this.coalesceRequest,
      getMeter: () => this.proxyMeter,
    });

    this.cache = new TurboContentCache({
      supabase: this.supabase,
      fetch: (url, init) => this.glFetch(url, init),
      apiRoot: this.apiRoot,
      getBranch: () => this.branch,
      host: 'GitLab',
    });
  }

  // Overrides GitLabBackend's own PKCE-based apiRequestFunction entirely —
  // this backend never obtains a GitLab OAuth token at all (the CMS user's
  // only credential is a Supabase JWT), so there is no `refresh_token` grant
  // to fall back to on a 401 the way the plain GitLab backend does. Instead
  // this injects the x-site-id header / site_id query param scoping the
  // shared `gl` Edge Function needs to know which tenant a request belongs
  // to. The request has already had apiRoot prepended by the time
  // requestFunction runs (see API.buildRequest), so scoping is added here
  // rather than at URL-construction time.
  apiRequestFunction = async (req: any): Promise<Response> => {
    const { session } = this;
    if (session.invalidMessage) return sessionEndedResponse(session.invalidMessage);
    try {
      await session.refreshIfNeeded();
    } catch (error) {
      // A refresh refused for good has just ended the session. Answered
      // rather than thrown, for the same reason as sessionEndedResponse.
      if (session.invalidMessage) return sessionEndedResponse(session.invalidMessage);
      throw error;
    }
    const accessToken = session.accessToken || this.token || '';
    const isGlProxyRequest = this.apiRoot.includes(PROXY_MARKER);

    let scopedReq = req;
    if (accessToken) {
      scopedReq = unsentRequest.withHeaders({ Authorization: `Bearer ${accessToken}` }, scopedReq);
    }
    if (this.siteId && isGlProxyRequest) {
      scopedReq = unsentRequest.withHeaders({ 'x-site-id': this.siteId }, scopedReq);
      scopedReq = unsentRequest.withParams({ site_id: this.siteId }, scopedReq);
    }

    // Coalescing and metering both hang off this one funnel — it is the only
    // place that sees the final, fully scoped request. `recordProxyResponse`
    // sits inside the coalesced work so the save meter counts round trips
    // actually made, rather than letting a joined duplicate inflate the count.
    const response: Response = await this.coalesceRequest(
      coalesceKey(scopedReq.get('method'), unsentRequest.toURL(scopedReq)),
      () =>
        unsentRequest.performRequest(scopedReq).then((res: Response) => {
          // Recorded here because this is the one place every API response
          // passes through — including failures, since a request that failed
          // still cost the editor the wait.
          recordProxyResponse(this.proxyMeter, res);
          return res;
        }),
    );

    if (response.ok || !isGlProxyRequest) return response;
    const body = await peekBody(response);
    const verdict = await session.reactToProxyAuthAnswer(response.status, body, false);
    if (verdict !== 'retry') return exposeProxyError(response, body);

    // The request was built with the refused token; rebuild its header with
    // the one just refreshed. Not coalesced: it is this caller's.
    const retried = unsentRequest.withHeaders(
      { Authorization: `Bearer ${session.accessToken}` },
      scopedReq,
    );
    const second: Response = await unsentRequest.performRequest(retried);
    recordProxyResponse(this.proxyMeter, second);
    if (second.ok) return second;
    const secondBody = await peekBody(second);
    await session.reactToProxyAuthAnswer(second.status, secondBody, true);
    return exposeProxyError(second, secondBody);
  };

  async status() {
    return {
      auth: { status: await this.session.authStatus() },
      api: { status: true, statusPage: '' },
    };
  }

  /**
   * The Turbo session lives on this instance, not only in the auth store core
   * clears — GitLabBackend.logout only nulls `token` and knows nothing about
   * Supabase. Without this, a logged-out CMS kept a usable access token
   * (`status()` would keep reporting `auth: true`), a Supabase client still
   * sending it, and a memoised `currentUser`.
   */
  async logout() {
    this.session.clear();
    this.editorBridgeInstance?.stop();
    return super.logout();
  }

  // Widened to `any`: decap-cms-core only ever forwards whatever this
  // returns to React unchanged (see Backend.authComponent in
  // decap-cms-core/src/backend.ts) — the concrete return type GitLabBackend
  // declares here is an artifact of its own AuthenticationPage's propTypes,
  // not a real contract, and SupabaseAuthenticationPage's props shape
  // legitimately differs (it doesn't need GitLab's OAuth-specific props at
  // all: base_url/siteId/authEndpoint/clearHash).
  authComponent(): any {
    return SupabaseAuthenticationPage;
  }

  restoreUser(user: User) {
    this.session.restore(user);
    return this.authenticate(user);
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

  async authenticate(state: Credentials) {
    // Idempotent; ticks do nothing until the session has a token.
    this.editorBridgeInstance?.start();
    await this.session.begin(state);

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

    // GitLabBackend builds these in its own `authenticate`, which this override
    // replaces wholesale - without them the notes pane has no API to call and
    // nothing watching the thread. Rebuilt rather than reused, so a second
    // login on the same instance cannot leave the previous session's manager
    // polling through the previous session's api.
    this.destroyNotesPolling();
    this.notesApi = new GitLabNotesAPI(this.api);
    this.pollingManager = new NotesPollingManager(this.notesApi.asPollingAPI(), 15000);

    // Permissions are only knowable post-auth, but nothing below the
    // write-access check needs them, so the two round trips overlap instead
    // of queueing. `currentUser` is local (session identity, no fetch), so it
    // joins them for free.
    //
    // Unlike the GitHub backend, `hasWriteAccess` is NOT redundant here: this
    // backend commits with the organization's GitLab group token, and whether
    // that token can write to this project is a real question with a real
    // answer, enforced below. On GitHub the equivalent check was asking about
    // a signed-in GitHub user that Turbo does not have.
    const [user, turboPermissions] = await Promise.all([
      this.api.user(),
      this.session.fetchPermissions(this.baseUrl!),
    ]);

    const isCollab = await this.api.hasWriteAccess().catch((error: Error) => {
      error.message = stripIndent`
        Repo "${this.repo}" not found.

        Please ensure the repo information is spelled correctly.

        If your project is under a group, ensure the group's access token has been granted to this project.
      `;
      throw error;
    });

    if (!isCollab) {
      throw new Error(
        'The configured GitLab access token does not have write access to this project.',
      );
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

    recordCmsEvent(
      this.baseUrl!,
      this.supabaseAnonKey,
      this.session.accessToken,
      'cms_session_started',
      this.siteId,
    );

    const displayIdentity = this.session.sessionIdentity();

    return {
      ...user,
      login: user.username,
      // The `gl` proxy synthesizes /user itself (the CMS user has no real
      // GitLab identity), and falls back to the literal name "CMS Editor"
      // when Supabase knows no full name — so prefer what the session says
      // about the person. This object is what core stores and the header
      // renders.
      ...(displayIdentity.name && { name: displayIdentity.name }),
      ...(displayIdentity.email && { email: displayIdentity.email }),
      avatar_url: displayIdentity.avatarUrl ?? user.avatar_url ?? null,
      ...this.session.storedUserFields(state, turboPermissions),
    };
  }

  async getToken(): Promise<string | null> {
    await this.session.refreshIfNeeded();
    return this.session.accessToken || this.token || null;
  }

  async currentUser(
    { token }: { token: string } = { token: this.token || '' },
  ): Promise<GitLabUser> {
    if (!this._currentUserPromise) {
      this._currentUserPromise = (async () => {
        await this.session.refreshIfNeeded();

        const owner = this.repo.split('/')[0];
        const identity = this.session.sessionIdentity();

        // `username` stays the project owner: other GitLab code paths treat it
        // as an identifier, not as a display name. `name`, `email` and the
        // avatar are the human-facing fields, and they name the person rather
        // than the group.
        return {
          id: 0,
          name: identity.name || owner,
          username: owner,
          email: identity.email,
          avatar_url: identity.avatarUrl,
          token,
          access_token: this.session.accessToken || undefined,
          refresh_token: this.session.refreshToken || undefined,
          expires_at: this.session.expiresAt || undefined,
        };
      })();
    }
    return this._currentUserPromise;
  }

  /**
   * Overrides GitLabBackend's, which reads the username off `api.user()` — a
   * round trip to the proxy, answered from the local part of the editor's
   * email, so two editors at different domains who share one collide.
   */
  async noteAuthorIdentity(): Promise<{ author: string; authorId?: string }> {
    return this.session.noteAuthorIdentity();
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
    const branch = savedBranch(save.result, options, entry, this.branch);
    recordSaveEvent(this.telemetryTarget(), entry, options, { ...save, branch });
    return save.result;
  }
}
