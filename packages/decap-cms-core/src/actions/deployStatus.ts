import { currentBackend } from '../backend';
import { addNotification, updateNotification } from './notifications';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';
import type { NotificationPayload } from './notifications';

/**
 * Post-save deploy notifications: a notification arrives when a deploy
 * accounts for the change, long after the short save toast is gone. The
 * watching belongs to the backend, so this is duck-typed: a backend without
 * these methods keeps today's behaviour, and core imports no backend.
 */

export const DEPLOY_STATUS_UPDATE = 'DEPLOY_STATUS_UPDATE';
export const DEPLOY_HISTORY_REQUEST = 'DEPLOY_HISTORY_REQUEST';
export const DEPLOY_HISTORY_SUCCESS = 'DEPLOY_HISTORY_SUCCESS';
export const DEPLOY_HISTORY_FAILURE = 'DEPLOY_HISTORY_FAILURE';

/** A deploy as the backend reports it, narrowed to what core reads. */
export interface Deployment {
  commit_sha: string;
  /** The branch that was built — the site's, or an editorial-workflow one. */
  branch?: string | null;
  source: string;
  external_id: string;
  provider_label: string | null;
  state: 'pending' | 'building' | 'success' | 'failed' | 'canceled';
  target_url: string | null;
  error_message: string | null;
  /** Where it published to, in the host's words. */
  environment?: string | null;
  finished_at: string | null;
  updated_at: string;
}

/** One CMS save, narrowed to what core reads. */
export interface DeployCommit {
  commit_sha: string;
  entry_label: string | null;
}

export type DeployStatusAction =
  | {
      type: typeof DEPLOY_STATUS_UPDATE;
      payload: {
        pendingCount: number;
        latest: Deployment | null;
        supported?: boolean;
        pageEnabled?: boolean;
        /** The branch the site publishes from; null when the backend cannot say. */
        branch?: string | null;
      };
    }
  | { type: typeof DEPLOY_HISTORY_REQUEST }
  | {
      type: typeof DEPLOY_HISTORY_SUCCESS;
      payload: { deployments: Deployment[]; commits: DeployCommit[] };
    }
  | { type: typeof DEPLOY_HISTORY_FAILURE; payload: { error: string } };

interface DeployResolution {
  /** `live` — a deploy containing the change succeeded. `failed` — one containing it failed. */
  status: 'live' | 'failed';
  entries: Array<{ entryPath: string; entryLabel?: string; entryUrlPath?: string }>;
  targetUrl: string | null;
}

interface DeployWatchingBackend {
  subscribeDeployResolutions?: (
    listener: (resolution: DeployResolution) => void,
  ) => (() => void) | null;
  recordSaveForDeployWatch?: (entryLabel?: string, entryUrlPath?: string) => boolean;
  commitUrl?: (sha: string) => string | null;
  subscribeDeployStatus?: (
    listener: (status: { pendingCount: number; latest: Deployment | null }) => void,
  ) => (() => void) | null;
  listDeployments?: () => Promise<Deployment[]>;
  listCommits?: () => Promise<DeployCommit[]>;
  deployStatusConfig?: () => {
    enabled: boolean;
    page: boolean;
    primaryTarget: string | null;
    branch?: string | null;
  };
}

/** One subscription for the session, so a resolution reaches the editor anywhere. */
let unsubscribe: (() => void) | null = null;

/**
 * The save toast on screen, if any: a deploy quick enough to beat it updates
 * it in place instead of stacking a second one.
 */
let saveNotificationId: string | null = null;

/** Behind the header pill; it never causes a poll, so it may outlive `unsubscribe`. */
let unsubscribeStatus: (() => void) | null = null;

function backendFor(getState: () => State): DeployWatchingBackend | null {
  try {
    return currentBackend(getState().config).implementation as unknown as DeployWatchingBackend;
  } catch {
    // Called before the config resolves, or by a backend that cannot be
    // constructed yet. There is nothing to subscribe to either way.
    return null;
  }
}

/**
 * Starts listening for deploy outcomes. Subscribing is also what makes the
 * backend resume its ledger of unpublished saves after a reload.
 */
export function startDeployNotifications() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (unsubscribe) {
      return;
    }
    const implementation = backendFor(getState);
    if (typeof implementation?.subscribeDeployResolutions !== 'function') {
      return;
    }
    unsubscribe =
      implementation.subscribeDeployResolutions(resolution =>
        dispatch(announceDeployResolution(resolution)),
      ) ?? null;
  };
}

/** Test seam, and the teardown counterpart of the above. */
export function stopDeployNotifications() {
  unsubscribe?.();
  unsubscribe = null;
  unsubscribeStatus?.();
  unsubscribeStatus = null;
  saveNotificationId = null;
}

/**
 * Wires the header pill, and takes the ONE read this feature makes on mount;
 * after that only the watcher polls, and only while a save is outstanding.
 */
export function startDeployStatus() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (unsubscribeStatus) {
      return;
    }

    const implementation = backendFor(getState);
    if (typeof implementation?.subscribeDeployStatus !== 'function') {
      return;
    }

    const config = implementation.deployStatusConfig?.() ?? {
      enabled: true,
      page: true,
      primaryTarget: null,
    };

    if (!config.enabled) {
      return;
    }

    unsubscribeStatus =
      implementation.subscribeDeployStatus(status =>
        dispatch({
          type: DEPLOY_STATUS_UPDATE,
          payload: {
            pendingCount: status.pendingCount,
            latest: status.latest,
            supported: true,
            pageEnabled: config.page,
            // Which branch is the site, so the page calls the right deploy "Live".
            branch: config.branch ?? null,
          },
        }),
      ) ?? null;

    if (unsubscribeStatus) {
      dispatch(loadDeployHistory());
    }
  };
}

/** Reads the site's recent deploys, at mount and on the Deploys page's Refresh. */
export function loadDeployHistory({ silent = false }: { silent?: boolean } = {}) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const implementation = backendFor(getState);
    if (typeof implementation?.listDeployments !== 'function') {
      return;
    }

    // `silent`: the Deploys page's background refresh must not flip the button.
    if (!silent) {
      dispatch({ type: DEPLOY_HISTORY_REQUEST });
    }

    try {
      // Together: a deploy with no entry name is the bare sha this read replaces.
      const [deployments, commits] = await Promise.all([
        implementation.listDeployments(),
        implementation.listCommits?.() ?? Promise.resolve([]),
      ]);
      dispatch({ type: DEPLOY_HISTORY_SUCCESS, payload: { deployments, commits } });
    } catch (error) {
      dispatch({
        type: DEPLOY_HISTORY_FAILURE,
        payload: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  };
}

/**
 * Where a commit can be read by a human, or null when the backend cannot say.
 * Read once by the Deploys page rather than stored, since it is derived.
 */
export function selectCommitUrl(state: State, sha: string): string | null {
  const implementation = backendFor(() => state);
  if (typeof implementation?.commitUrl !== 'function') {
    return null;
  }
  try {
    return implementation.commitUrl(sha);
  } catch {
    return null;
  }
}

/**
 * Announces a completed save, and asks the backend to watch for the deploy
 * that carries it. Editorial workflow keeps the plain toast: an unpublished
 * change has not deployed.
 */
export function notifyEntrySaved(entryLabel?: string, entryUrlPath?: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const implementation = backendFor(getState);

    // Idempotent, and here as well as at mount so a backend that becomes
    // available later still gets subscribed.
    dispatch(startDeployNotifications());

    const watching =
      typeof implementation?.recordSaveForDeployWatch === 'function' &&
      implementation.recordSaveForDeployWatch(entryLabel, entryUrlPath);

    const id = crypto.randomUUID();
    saveNotificationId = watching ? id : null;

    dispatch(
      addNotification({
        id,
        // "Publishing…" only where a deploy will actually be reported;
        // promising a follow-up that cannot come would be worse than silence.
        message: { key: watching ? 'ui.toast.entryPublishing' : 'ui.toast.entrySaved' },
        type: 'success',
        // Short either way. The editor is not made to watch a build.
        dismissAfter: 4000,
      }),
    );
  };
}

function announceDeployResolution(resolution: DeployResolution) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const entries = resolution.entries ?? [];
    const only = entries.length === 1 ? entries[0] : null;

    // The deploy's own URL is the live site, not the build log; `site_url` is
    // the fallback, and with neither no link is shown.
    const siteUrl = resolution.targetUrl || state.config.site_url;

    // One named entry links to that entry; a grouped "3 changes are live" has
    // no single page to point at.
    const entryUrl = only?.entryUrlPath ? joinUrl(siteUrl, only.entryUrlPath) : null;

    const payload: Partial<NotificationPayload> =
      resolution.status === 'live'
        ? {
            // Named when it is one entry, counted when it is several — one
            // notification either way, never a stack of them.
            message: only
              ? { key: 'ui.toast.entryLive', entry: only.entryLabel || only.entryPath }
              : { key: 'ui.toast.entriesLive', count: entries.length },
            type: 'success',
            dismissAfter: 8000,
            link: entryUrl
              ? linkTo(entryUrl, 'ui.toast.viewEntry')
              : linkTo(siteUrl, 'ui.toast.viewSite'),
          }
        : {
            message: { key: 'ui.toast.entryDeployFailed' },
            type: 'error',
            // Held open: this is the one outcome the editor has to act on, and
            // the action is the link inside the toast. Dismissible by click.
            dismissAfter: false,
            link: linkTo(resolution.targetUrl, 'ui.toast.viewBuildLog'),
          };

    const saveToastStillUp =
      saveNotificationId !== null &&
      state.notifications.notifications.some(
        notification => notification.id === saveNotificationId,
      );

    if (saveToastStillUp) {
      dispatch(updateNotification(saveNotificationId as string, payload));
      saveNotificationId = null;
      return;
    }

    dispatch(addNotification(payload as NotificationPayload));
  };
}

function linkTo(url: string | null | undefined, labelKey: string) {
  return url ? { url, label: { key: labelKey } } : undefined;
}

/** Joins a site URL to an entry path without doubling or dropping the slash. */
function joinUrl(base: string | null | undefined, path: string) {
  if (!base) {
    return null;
  }
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
