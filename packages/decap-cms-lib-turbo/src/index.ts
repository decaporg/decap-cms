import SupabaseAuthenticationPage from './AuthenticationPage';
import { resolveCommitAuthorFromSupabaseUser } from './commitAuthor';
import { TurboContentCache } from './contentCache';
import { attachEditorBridge } from './editorAttach';
import { EditorBridge, registerAskClaudeAction } from './editorBridge';
import { supabaseUserIdFromToken } from './noteIdentity';
import { createPreloadConfig } from './preloadConfig';
import { coalesceKey, createRequestCoalescer } from './requestCoalescer';
import { meterSave, recordSaveEvent, savedBranch } from './saveEvent';
import {
  createProxyMeter,
  measurePayloadBytes,
  parseServerTimingMs,
  recordProxyResponse,
} from './saveMetrics';
import {
  createScopedFetch,
  exposeProxyError,
  peekBody,
  proxyErrorMessage,
  sessionEndedResponse,
} from './scopedFetch';
import {
  PROXY_UNAUTHORIZED_BODY,
  REFRESH_BUFFER_SECONDS,
  REFRESH_COOLDOWN_MS,
  REFRESH_RETRY_ATTEMPTS,
  REPO_SCOPE_MARKER,
  SESSION_EXPIRED_MESSAGE,
  SITE_ACCESS_DENIED_MARKER,
  TERMINAL_PROXY_CODES,
  TERMINAL_REFRESH_CODES,
  TURBO_SITE_ACCESS_DENIED_MESSAGE,
  TurboSession,
  terminalProxyRefusal,
} from './session';
import { expiresAtOf, revokeSession, sessionIdOf, withRefreshLock } from './sessionSync';
import { SupabaseClient } from './supabase';
import { recordCmsEvent } from './telemetry';

export type { ContentCacheOptions, SyncResult } from './contentCache';
export type { EditorAttachArgs, EditorAttachOptions } from './editorAttach';
export type {
  EditorApi,
  EditorBridgeOptions,
  EditorSnapshot,
  FieldActionContext,
  RegisterFieldAction,
} from './editorBridge';
export type { RequestCoalescer } from './requestCoalescer';
export type { MeteredSave, TelemetryTarget } from './saveEvent';
export type { ProxyMeter } from './saveMetrics';
export type { ScopedFetch, ScopedFetchOptions } from './scopedFetch';
export type {
  SessionTokens,
  SupabaseRefreshError,
  SupabaseUser,
  TurboPermissions,
  TurboSessionOptions,
} from './session';

export {
  PROXY_UNAUTHORIZED_BODY,
  REFRESH_BUFFER_SECONDS,
  REFRESH_COOLDOWN_MS,
  REFRESH_RETRY_ATTEMPTS,
  REPO_SCOPE_MARKER,
  SESSION_EXPIRED_MESSAGE,
  SITE_ACCESS_DENIED_MARKER,
  TERMINAL_PROXY_CODES,
  TERMINAL_REFRESH_CODES,
  TURBO_SITE_ACCESS_DENIED_MESSAGE,
  EditorBridge,
  SupabaseAuthenticationPage,
  SupabaseClient,
  TurboContentCache,
  TurboSession,
  attachEditorBridge,
  coalesceKey,
  createPreloadConfig,
  createProxyMeter,
  createRequestCoalescer,
  createScopedFetch,
  expiresAtOf,
  exposeProxyError,
  measurePayloadBytes,
  meterSave,
  parseServerTimingMs,
  peekBody,
  proxyErrorMessage,
  recordCmsEvent,
  recordProxyResponse,
  recordSaveEvent,
  registerAskClaudeAction,
  resolveCommitAuthorFromSupabaseUser,
  revokeSession,
  savedBranch,
  sessionEndedResponse,
  sessionIdOf,
  supabaseUserIdFromToken,
  terminalProxyRefusal,
  withRefreshLock,
};

/** The UMD build's export; scripts/webpack.js names it after the package. */
export const DecapCmsLibTurbo = {
  EditorBridge,
  SupabaseAuthenticationPage,
  SupabaseClient,
  TurboContentCache,
  TurboSession,
  attachEditorBridge,
  coalesceKey,
  createPreloadConfig,
  createProxyMeter,
  createRequestCoalescer,
  createScopedFetch,
  expiresAtOf,
  exposeProxyError,
  measurePayloadBytes,
  meterSave,
  parseServerTimingMs,
  peekBody,
  proxyErrorMessage,
  recordCmsEvent,
  recordProxyResponse,
  recordSaveEvent,
  registerAskClaudeAction,
  resolveCommitAuthorFromSupabaseUser,
  revokeSession,
  savedBranch,
  sessionEndedResponse,
  sessionIdOf,
  supabaseUserIdFromToken,
  terminalProxyRefusal,
  withRefreshLock,
};
