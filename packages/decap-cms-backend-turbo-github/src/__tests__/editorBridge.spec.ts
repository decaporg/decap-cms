import { EditorBridge, registerAskClaudeAction } from '../editorBridge';

import type { EditorApi, EditorSnapshot } from '../editorBridge';

const SITE = 'site-1';

function snapshot(overrides: Partial<EditorSnapshot> = {}): EditorSnapshot {
  return {
    collection: 'posts',
    collectionLabel: 'Posts',
    slug: 'hello',
    fields: [
      { name: 'title', label: 'Title', widget: 'string' },
      { name: 'body', label: 'Body', widget: 'markdown' },
    ],
    data: { title: 'Hello', body: 'Body' },
    ...overrides,
  };
}

function fakeEditor(initial: EditorSnapshot | null) {
  let listener: ((s: EditorSnapshot | null) => void) | null = null;
  let current = initial;
  const editor = {
    getCurrentEntry: jest.fn(() => current),
    applyFieldPatch: jest.fn((patches: { path: string }[]) => ({
      applied: patches.filter(p => p.path !== 'nope').map(p => p.path),
      rejected: patches
        .filter(p => p.path === 'nope')
        .map(p => ({ path: p.path, reason: 'no such field' })),
    })),
    onEditorChange: jest.fn((cb: (s: EditorSnapshot | null) => void) => {
      listener = cb;
      return () => {
        listener = null;
      };
    }),
  };
  return {
    editor: editor as unknown as EditorApi & typeof editor,
    open(next: EditorSnapshot | null) {
      current = next;
      listener?.(next);
    },
  };
}

type Call = { name: string; body: Record<string, unknown> };

function stubFetch(patchesPerSync: unknown[][] = []) {
  const calls: Call[] = [];
  let sync = 0;
  global.fetch = jest.fn(async (url: string, init: { body: string }) => {
    const name = String(url).split('/rpc/')[1];
    calls.push({ name, body: JSON.parse(init.body) });
    const payload =
      name === 'editor_session_sync' ? { patches: patchesPerSync[sync++] ?? [] } : null;
    return { ok: true, status: 200, text: async () => (payload ? JSON.stringify(payload) : '') };
  }) as unknown as typeof fetch;
  return calls;
}

/** Jest 27 has no advanceTimersByTimeAsync: step the clock and drain promise chains between steps. */
async function flush(ms: number) {
  let elapsed = 0;
  do {
    const step = Math.min(100, ms - elapsed);
    jest.advanceTimersByTime(step);
    elapsed += Math.max(step, 1);
    for (let i = 0; i < 50; i++) await Promise.resolve();
  } while (elapsed < ms);
}

let token: string | null;

function bridgeFor(editor: EditorApi) {
  return new EditorBridge(editor, {
    baseUrl: 'https://sb.example.com',
    anonKey: 'anon',
    siteId: SITE,
    getAccessToken: () => token,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  window.sessionStorage.clear();
  document.body.innerHTML = '';
  token = 'jwt';
});

afterEach(() => {
  jest.useRealTimers();
});

describe('EditorBridge', () => {
  it('syncs an open entry with its snapshot, then heartbeats without one', async () => {
    const calls = stubFetch();
    const { editor } = fakeEditor(snapshot());
    bridgeFor(editor).start();
    await flush(0);

    expect(calls[0]).toMatchObject({
      name: 'editor_session_sync',
      body: {
        p_site_id: SITE,
        p_collection: 'posts',
        p_slug: 'hello',
        p_snapshot: { slug: 'hello' },
      },
    });
    await flush(4000);
    expect(calls[1]).toMatchObject({ name: 'editor_session_sync', body: { p_snapshot: null } });
    // The tab keeps one session id across calls.
    expect(calls[1].body.p_session_id).toBe(calls[0].body.p_session_id);
  });

  it('applies pending patches and acknowledges what applied', async () => {
    const calls = stubFetch([
      [
        {
          patch_id: 'p1',
          changes: [
            { path: 'title', value: 'New' },
            { path: 'nope', value: 1 },
          ],
          locale: 'de',
          client: 'mcp',
        },
      ],
    ]);
    const { editor } = fakeEditor(snapshot());
    bridgeFor(editor).start();
    await flush(0);

    expect(editor.applyFieldPatch).toHaveBeenCalledWith(
      [
        { path: 'title', value: 'New' },
        { path: 'nope', value: 1 },
      ],
      { locale: 'de' },
    );
    expect(calls.find(c => c.name === 'editor_patch_ack')?.body).toEqual({
      p_patch_id: 'p1',
      p_status: 'partial',
      p_result: { applied: ['title'], rejected: [{ path: 'nope', reason: 'no such field' }] },
    });
    expect(document.body.textContent).toContain('An agent changed Title');
  });

  it('closes the session when the entry closes, and shows the indicator only while one is open', async () => {
    const calls = stubFetch();
    const { editor, open } = fakeEditor(snapshot());
    bridgeFor(editor).start();
    await flush(0);
    expect(document.body.textContent).toContain('Agent bridge on');

    open(null);
    await flush(0);
    expect(calls.some(c => c.name === 'editor_session_close')).toBe(true);
    expect(document.body.textContent).not.toContain('Agent bridge on');
  });

  it('does nothing without a token', async () => {
    token = null;
    const calls = stubFetch();
    const { editor } = fakeEditor(snapshot());
    bridgeFor(editor).start();
    await flush(10000);
    expect(calls).toHaveLength(0);
  });

  it('backs off quietly when the server refuses', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 403,
      text: async () => '',
    })) as unknown as typeof fetch;
    const { editor } = fakeEditor(snapshot());
    bridgeFor(editor).start();
    await flush(0);
    await flush(10000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await flush(30000);
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(1);
    warn.mockRestore();
  });

  it('turns off for the tab from the indicator, and stays off', async () => {
    stubFetch();
    const { editor } = fakeEditor(snapshot());
    const bridge = bridgeFor(editor);
    bridge.start();
    await flush(0);
    document.querySelector<HTMLButtonElement>('[role="status"] button')!.click();
    expect(bridge.running).toBe(false);
    expect(EditorBridge.isTurnedOff()).toBe(true);
    bridgeFor(editor).start();
    expect(editor.onEditorChange).toHaveBeenCalledTimes(1);
  });
});

describe('registerAskClaudeAction', () => {
  it('prompts with identifiers only, never the entry content', () => {
    const register = jest.fn();
    const { editor } = fakeEditor(snapshot());
    const bridge = bridgeFor(editor);
    registerAskClaudeAction(register, () => bridge, SITE);
    const action = register.mock.calls[0][0];

    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
    const assigned: string[] = [];
    const location = window.location;
    // jsdom cannot navigate to claude://; capture the assignment instead.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        set href(value: string) {
          assigned.push(value);
        },
      },
    });

    action.onClick({
      field: { name: 'title', label: 'Title' },
      collection: 'posts',
      entry: snapshot(),
    });
    Object.defineProperty(window, 'location', { configurable: true, value: location });

    const prompt = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0] as string;
    expect(prompt).toContain('get_open_editor');
    expect(prompt).toContain('"Title" field (title)');
    expect(prompt).toContain(SITE);
    expect(prompt).not.toContain('Body'); // a value, not an identifier
    expect(assigned[0]).toBe(`claude://claude.ai/new?q=${encodeURIComponent(prompt)}`);
  });

  it('is only offered while the bridge runs', () => {
    const register = jest.fn();
    registerAskClaudeAction(register, () => null, SITE);
    expect(register.mock.calls[0][0].isAvailable()).toBe(false);
  });
});
