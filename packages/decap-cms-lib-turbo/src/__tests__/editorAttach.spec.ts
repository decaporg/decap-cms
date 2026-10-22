import { attachEditorBridge } from '../editorAttach';

import type { EditorBridge } from '../editorBridge';

function editorApi() {
  return {
    getCurrentEntry: jest.fn(() => null),
    applyFieldPatch: jest.fn(() => ({ applied: [], rejected: [] })),
    onEditorChange: jest.fn(() => () => undefined),
  };
}

const options = {
  enabled: true,
  baseUrl: undefined,
  supabaseId: 'supabase-project-id',
  anonKey: 'supabase-anon-key',
  siteId: 'site-123',
  getAccessToken: () => 'access-token',
};

describe('attachEditorBridge', () => {
  it('stays off unless the site opts in', () => {
    // Still in development: on by default it would advertise itself on every
    // entry and upload every editor's unsaved draft, agent or not.
    const host: { editorBridgeInstance: EditorBridge | null } = { editorBridgeInstance: null };
    const editor = editorApi();
    const registerFieldAction = jest.fn();

    attachEditorBridge(host, { editor, registerFieldAction } as any, {
      ...options,
      enabled: false,
    });

    expect(host.editorBridgeInstance).toBeNull();
    expect(editor.onEditorChange).not.toHaveBeenCalled();
    expect(registerFieldAction).not.toHaveBeenCalled();
  });

  it('needs a Supabase project, a site and a key to have anything to talk to', () => {
    const host: { editorBridgeInstance: EditorBridge | null } = { editorBridgeInstance: null };

    attachEditorBridge(host, { editor: editorApi(), registerFieldAction: jest.fn() } as any, {
      ...options,
      siteId: '',
    });

    expect(host.editorBridgeInstance).toBeNull();
  });

  it('starts the bridge and registers "Ask Claude" against whichever bridge the host holds', () => {
    const host: { editorBridgeInstance: EditorBridge | null } = { editorBridgeInstance: null };
    const editor = editorApi();
    const registerFieldAction = jest.fn();

    attachEditorBridge(host, { editor, registerFieldAction } as any, options);

    expect(host.editorBridgeInstance).not.toBeNull();
    expect(editor.onEditorChange).toHaveBeenCalledTimes(1);
    expect(registerFieldAction).toHaveBeenCalledTimes(1);

    const action = registerFieldAction.mock.calls[0][0];
    expect(action.id).toBe('decap-turbo-ask-claude');
    expect(action.isAvailable()).toBe(true);
    host.editorBridgeInstance!.stop();
    expect(action.isAvailable()).toBe(false);
  });
});
