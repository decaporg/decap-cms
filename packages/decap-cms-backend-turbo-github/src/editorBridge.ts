/**
 * The Decap Turbo editor bridge, CMS side: lets an AI agent (through the
 * Turbo API, `decap mcp`'s set_fields) change fields in the entry open in this
 * tab. The person sees the change highlighted and decides whether to save.
 *
 * NOTE: byte-for-byte the same as decap-cms-backend-turbo-gitlab's copy, for
 * the same reason as supabase.ts: Turbo-only code with no shared package yet.
 * Changes here must be mirrored.
 *
 * While an entry is open and the tab is visible, the bridge calls the
 * `editor_session_sync` RPC every few seconds as the signed-in user. One call
 * records the tab as open on that entry (with a snapshot of its fields and
 * current values when they changed) and returns the patches waiting for it,
 * which are applied through the core editor API (`CMS.editor`) and
 * acknowledged with `editor_patch_ack`. Polling rather than Realtime keeps the
 * Supabase client out of the CMS bundle (decap-turbo docs/ai-agents-plan.md,
 * "The editor bridge").
 */

/** The parts of decap-cms-core's editor API (lib/editorApi.ts) the bridge uses. */
export interface EditorSnapshot {
  collection: string;
  collectionLabel: string;
  slug: string | null;
  fields: { name: string; label?: string; widget?: string }[];
  [key: string]: unknown;
}

export interface EditorApi {
  getCurrentEntry(): EditorSnapshot | null;
  applyFieldPatch(
    patches: { path: string; value: unknown }[],
    options?: { locale?: string },
  ): { applied: string[]; rejected: { path: string; reason: string }[] };
  onEditorChange(listener: (snapshot: EditorSnapshot | null) => void): () => void;
}

export interface FieldActionContext {
  field: { name: string; label?: string };
  collection: string;
  entry: EditorSnapshot | null;
}

export type RegisterFieldAction = (action: {
  id: string;
  label: string;
  title?: string;
  isAvailable?: (context: FieldActionContext) => boolean;
  onClick: (context: FieldActionContext) => void;
}) => void;

export interface EditorBridgeOptions {
  baseUrl: string;
  anonKey: string;
  siteId: string;
  getAccessToken: () => string | null;
}

interface PendingPatch {
  patch_id: string;
  changes: { path: string; value: unknown }[];
  locale: string | null;
  client: string;
}

const ACTIVE_POLL_MS = 2000;
const IDLE_POLL_MS = 3500;
const HIDDEN_POLL_MS = 5000;
const SNAPSHOT_DEBOUNCE_MS = 800;
const BACKOFF_MS = 30000;
/** After this long without a patch, poll at the idle rate. */
const RECENT_PATCH_MS = 30000;
const SESSION_KEY = 'decap-turbo-editor-session';
const OFF_KEY = 'decap-turbo-editor-bridge-off';

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** One id per browser tab, kept across reloads of that tab. */
function tabSessionId(): string {
  const store = storage();
  const existing = store?.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  store?.setItem(SESSION_KEY, id);
  return id;
}

/** A small fixed badge saying the bridge is on, and what it last changed. */
class Indicator {
  private element: HTMLDivElement | null = null;
  private label: HTMLSpanElement | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onTurnOff: () => void) {}

  show() {
    if (this.element || typeof document === 'undefined') return;
    const element = document.createElement('div');
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.style.cssText = [
      'position:fixed',
      'left:16px',
      'bottom:16px',
      'z-index:400',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'max-width:420px',
      'padding:6px 8px 6px 12px',
      'border-radius:16px',
      'background:#313d3e',
      'color:#fff',
      'font:600 12px/1.4 system-ui,sans-serif',
      'box-shadow:0 2px 6px rgba(0,0,0,.2)',
    ].join(';');
    const label = document.createElement('span');
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.title = 'Turn off the agent bridge for this tab';
    close.setAttribute('aria-label', close.title);
    close.style.cssText =
      'border:0;background:transparent;color:inherit;font-size:16px;line-height:1;cursor:pointer;padding:0 4px';
    close.addEventListener('click', () => this.onTurnOff());
    element.append(label, close);
    document.body.appendChild(element);
    this.element = element;
    this.label = label;
    this.idle();
  }

  idle() {
    if (this.label) {
      this.label.textContent = 'Agent bridge on: AI agents you connected can edit this entry';
    }
  }

  say(message: string, ms = 7000) {
    if (!this.label) return;
    this.label.textContent = message;
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.idle(), ms);
  }

  hide() {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.element?.remove();
    this.element = null;
    this.label = null;
  }
}

export class EditorBridge {
  private readonly sessionId = tabSessionId();
  private readonly indicator = new Indicator(() => this.turnOff());
  private unsubscribe: (() => void) | null = null;
  private snapshot: EditorSnapshot | null = null;
  private snapshotDirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private lastPatchAt = 0;
  private backoffUntil = 0;
  private stopped = false;

  constructor(private readonly editor: EditorApi, private readonly options: EditorBridgeOptions) {}

  static isTurnedOff(): boolean {
    return storage()?.getItem(OFF_KEY) === '1';
  }

  start() {
    if (this.unsubscribe || EditorBridge.isTurnedOff()) return;
    this.stopped = false;
    this.unsubscribe = this.editor.onEditorChange(snapshot => this.onChange(snapshot));
    this.onChange(this.editor.getCurrentEntry());
    window.addEventListener('pagehide', this.onPageHide);
  }

  stop() {
    this.stopped = true;
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.timer) clearTimeout(this.timer);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.timer = null;
    window.removeEventListener('pagehide', this.onPageHide);
    if (this.snapshot) void this.close();
    this.snapshot = null;
    this.indicator.hide();
  }

  get running() {
    return Boolean(this.unsubscribe);
  }

  /** Shown in the indicator after the "Ask Claude" action copied a prompt. */
  notify(message: string) {
    this.indicator.say(message);
  }

  private turnOff() {
    storage()?.setItem(OFF_KEY, '1');
    this.stop();
  }

  private readonly onPageHide = () => {
    if (this.snapshot) void this.close(true);
  };

  private onChange(snapshot: EditorSnapshot | null) {
    if (this.stopped) return;
    const wasOpen = Boolean(this.snapshot);
    this.snapshot = snapshot;

    if (!snapshot) {
      if (wasOpen) void this.close();
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.indicator.hide();
      return;
    }

    this.indicator.show();
    this.snapshotDirty = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.tick(), wasOpen ? SNAPSHOT_DEBOUNCE_MS : 0);
  }

  private schedule(ms: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), ms);
  }

  private nextDelay(): number {
    if (typeof document !== 'undefined' && document.hidden) return HIDDEN_POLL_MS;
    return Date.now() - this.lastPatchAt < RECENT_PATCH_MS ? ACTIVE_POLL_MS : IDLE_POLL_MS;
  }

  private headers(token: string): Record<string, string> {
    return {
      apikey: this.options.anonKey,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };
  }

  private async rpc<T>(
    name: string,
    body: Record<string, unknown>,
    keepalive = false,
  ): Promise<T | null> {
    const token = this.options.getAccessToken();
    if (!token) return null;
    const response = await fetch(`${this.options.baseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: this.headers(token),
      body: JSON.stringify(body),
      keepalive,
    });
    if (!response.ok) throw new Error(`${name} answered ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T | null;
  }

  private async tick() {
    if (this.stopped || !this.snapshot) return;
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (this.inFlight || Date.now() < this.backoffUntil || (hidden && !this.snapshotDirty)) {
      this.schedule(this.nextDelay());
      return;
    }

    const snapshot = this.snapshot;
    const sendSnapshot = this.snapshotDirty;
    this.snapshotDirty = false;
    this.inFlight = true;
    try {
      const result = await this.rpc<{ patches: PendingPatch[] }>('editor_session_sync', {
        p_session_id: this.sessionId,
        p_site_id: this.options.siteId,
        p_collection: snapshot.collection,
        p_slug: snapshot.slug,
        p_snapshot: sendSnapshot ? snapshot : null,
      });
      for (const patch of result?.patches ?? []) await this.apply(patch);
    } catch (error) {
      // Signed out, not a member, or offline: try again later, quietly. The
      // bridge is a convenience and must never get in the way of editing.
      if (sendSnapshot) this.snapshotDirty = true;
      this.backoffUntil = Date.now() + BACKOFF_MS;
      console.warn('Decap Turbo editor bridge:', error);
    } finally {
      this.inFlight = false;
    }
    this.schedule(this.nextDelay());
  }

  private async apply(patch: PendingPatch) {
    this.lastPatchAt = Date.now();
    const result = this.editor.applyFieldPatch(
      patch.changes,
      patch.locale ? { locale: patch.locale } : {},
    );
    const status =
      result.rejected.length === 0 ? 'applied' : result.applied.length > 0 ? 'partial' : 'rejected';
    await this.rpc('editor_patch_ack', {
      p_patch_id: patch.patch_id,
      p_status: status,
      p_result: result,
    });

    if (result.applied.length > 0) {
      const labels = result.applied.map(path => {
        const field = this.snapshot?.fields.find(f => f.name === path.split('.')[0]);
        return field?.label ?? path;
      });
      this.indicator.say(`An agent changed ${[...new Set(labels)].join(', ')}. Review, then Save.`);
      // The values changed: the next sync carries the new snapshot.
      this.snapshotDirty = true;
    }
  }

  private async close(keepalive = false) {
    try {
      await this.rpc('editor_session_close', { p_session_id: this.sessionId }, keepalive);
    } catch {
      // The server sweeps sessions it stops hearing from.
    }
  }
}

/**
 * The "Ask Claude" field action: copies a prompt naming this field and entry
 * — identifiers only, never content, which the agent reads through the bridge
 * — and opens Claude Desktop with it. Any other agent with the decap MCP
 * server works with the copied prompt.
 */
function ignore(): void {
  // Deliberately nothing; see the caller.
}

export function registerAskClaudeAction(
  registerFieldAction: RegisterFieldAction,
  bridge: () => EditorBridge | null,
  siteId: string,
) {
  registerFieldAction({
    id: 'decap-turbo-ask-claude',
    label: 'Ask Claude',
    title: 'Open Claude with a prompt to edit this field. Nothing is saved until you save.',
    isAvailable: () => Boolean(bridge()?.running),
    onClick: context => {
      const fieldLabel = context.field.label ?? context.field.name;
      const entry = context.entry;
      const entryName = entry?.slug ? `"${entry.slug}"` : 'new';
      const prompt =
        `I have the ${
          entry?.collectionLabel ?? context.collection
        } entry ${entryName} open in Decap CMS (site ${siteId}). ` +
        `Using the decap MCP server, call get_open_editor to read it, then set_fields to change the ` +
        `"${fieldLabel}" field (${context.field.name}). Don't save; I'll review it in the editor.\n\nWhat I want: `;

      // A refused clipboard is fine: the prompt still opens Claude.
      void navigator.clipboard?.writeText(prompt).catch(ignore);
      bridge()?.notify('Prompt copied. If Claude Desktop did not open, paste it into your agent.');
      window.location.href = `claude://claude.ai/new?q=${encodeURIComponent(prompt)}`;
    },
  });
}
