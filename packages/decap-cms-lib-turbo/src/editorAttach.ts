import { EditorBridge, registerAskClaudeAction } from './editorBridge';

import type { EditorApi, RegisterFieldAction } from './editorBridge';

export interface EditorAttachArgs {
  editor: EditorApi;
  registerFieldAction: RegisterFieldAction;
}

export interface EditorAttachOptions {
  /** `editor_bridge: true` in config.yml; see the backends' constructors. */
  enabled: boolean;
  baseUrl: string | undefined;
  supabaseId: string;
  anonKey: string;
  siteId: string;
  /** Read per request: the token is refreshed during the session. */
  getAccessToken: () => string | null;
}

/**
 * What a backend's `attachEditor` does: starts the editor bridge on `host` and
 * adds the "Ask Claude" action beside each field. Core's arguments are
 * duck-typed; this package does not depend on core.
 */
export function attachEditorBridge(
  host: { editorBridgeInstance: EditorBridge | null },
  { editor, registerFieldAction }: EditorAttachArgs,
  options: EditorAttachOptions,
) {
  const baseUrl =
    options.baseUrl || (options.supabaseId && `https://${options.supabaseId}.supabase.co`);
  if (!options.enabled || !baseUrl || !options.siteId || !options.anonKey) return;
  host.editorBridgeInstance = new EditorBridge(editor, {
    baseUrl,
    anonKey: options.anonKey,
    siteId: options.siteId,
    getAccessToken: options.getAccessToken,
  });
  host.editorBridgeInstance.start();
  registerAskClaudeAction(registerFieldAction, () => host.editorBridgeInstance, options.siteId);
}
