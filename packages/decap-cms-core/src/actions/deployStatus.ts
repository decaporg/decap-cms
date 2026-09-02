import { currentBackend } from '../backend';
import { addNotification, updateNotification } from './notifications';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';
import type { NotificationPayload } from './notifications';

/**
 * Post-save deploy notifications. See decap-turbo/docs/deploy-status-plan.md
 * §A4b.
 *
 * A save tells the editor their entry was committed; it does not tell them
 * whether the site they publish has actually rebuilt. This adds the second
 * half — but asynchronously: the save toast is short-lived, the editor carries
 * on working, and a notification arrives when a deploy accounts for the
 * change. A build can run for many minutes, and a toast that dwells for all of
 * them informs nobody.
 *
 * The watching itself belongs to the backend (Turbo polls its own
 * `site_deployments` table and asks git about ancestry), so this is
 * deliberately duck-typed: a backend without these methods gets exactly
 * today's behaviour, with no import relationship between core and any
 * particular backend.
 */

export const DEPLOY_STATUS_UPDATE = 'DEPLOY_STATUS_UPDATE';
export const DEPLOY_HISTORY_REQUEST = 'DEPLOY_HISTORY_REQUEST';
export const DEPLOY_HISTORY_SUCCESS = 'DEPLOY_HISTORY_SUCCESS';
export const DEPLOY_HISTORY_FAILURE = 'DEPLOY_HISTORY_FAILURE';

/** One row of `site_deployments`, as the backend hands it over. */
export interface DeploymentRow {
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
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
}

/** One CMS save, as `site_commits` records it. */
export interface CommitRow {
  commit_sha: string;
  branch: string;
  entry_label: string | null;
  entry_path: string | null;
  message: string | null;
  created_at: string;
}

export type DeployStatusAction =
  | {
      type: typeof DEPLOY_STATUS_UPDATE;
      payload: {
        pendingCount: number;
        latest: DeploymentRow | null;
        supported?: boolean;
        pageEnabled?: boolean;
        /** The branch the site publishes from; null when the backend cannot say. */
        branch?: string | null;
      };
    }
  | { type: typeof DEPLOY_HISTORY_REQUEST }
  | {
      type: typeof DEPLOY_HISTORY_SUCCESS;
      payload: { deployments: DeploymentRow[]; commits: CommitRow[] };
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
    listener: (status: { pendingCount: number; latest: DeploymentRow | null }) => void,
  ) => (() => void) | null;
  listDeployments?: (limit?: number) => Promise<DeploymentRow[]>;
  listCommits?: (limit?: number) => Promise<CommitRow[]>;
  deployStatusConfig?: () => {
    enabled: boolean;
    page: boolean;
    primaryTarget: string | null;
    branch?: string | null;
  };
}

/**
 * One subscription for the session, so a resolution reaches the editor
 * wherever they are in the CMS — including on an entry they are no longer
 * looking at, or a collection they have navigated away from.
 */
let unsubscribe: (() => void) | null = null;

/**
 * The save toast currently on screen, if any. A deploy usually resolves long
 * after it has gone, in which case the resolution is a new notification; when
 * the deploy is quick enough to beat it, the toast is updated in place instead
 * of a second one stacking beside it.
 */
let saveNotificationId: string | null = null;

/**
 * The status subscription behind the header pill. Held separately from
 * `unsubscribe` because it has different lifecycle rules: it never causes a
 * poll, so it can outlive the notification subscription harmlessly.
 */
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
 * Starts listening for deploy outcomes. Dispatched once when the CMS mounts,
 * which is also what lets a watch survive a page reload: the backend restores
 * its ledger of unpublished saves when something subscribes.
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
 * Wires the header pill, and takes the ONE read this feature makes on mount.
 *
 * That single read is what lets an editor who has saved nothing this session
 * still see whether the site is live or its last build failed. Everything
 * after it is driven by the watcher, which polls only while a save is
 * outstanding — a pill that polled to stay current would undo the whole point
 * of §A4b. See §A8.
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
            // Which branch is the site. Without it the page cannot tell a
            // deploy of the site from a deploy of an editorial-workflow
            // branch, and calls the wrong one "Live".
            branch: config.branch ?? null,
          },
        }),
      ) ?? null;

    if (unsubscribeStatus) {
      dispatch(loadDeployHistory());
    }
  };
}

/**
 * Reads the site's recent deploys. Dispatched once at mount and again by the
 * Deploys page's Refresh — the same affordance Decap already offers for deploy
 * preview links, so a manual check does not read as an admission that the
 * automatic path is unreliable.
 */
export function loadDeployHistory({
  limit,
  silent = false,
}: { limit?: number; silent?: boolean } = {}) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const implementation = backendFor(getState);
    if (typeof implementation?.listDeployments !== 'function') {
      return;
    }

    // `silent` is for the background refresh the Deploys page runs while it is
    // open: without it every tick would flip the Refresh button to
    // "Refreshing…" and the page would visibly twitch once a poll.
    if (!silent) {
      dispatch({ type: DEPLOY_HISTORY_REQUEST });
    }

    try {
      // Together, because the page is unreadable with one and not the other:
      // a deploy with no entry name is the bare sha this read exists to
      // replace. A backend that cannot list commits simply contributes none.
      const [deployments, commits] = await Promise.all([
        implementation.listDeployments(limit),
        implementation.listCommits?.(limit) ?? Promise.resolve([]),
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
 * that carries it.
 *
 * Replaces the plain `Entry saved` toast at the one call site that publishes
 * directly. Editorial workflow keeps the plain toast: saving there creates an
 * unpublished change, which by definition has not deployed.
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

    // The deploy's own URL is the live site (§A2 — it is `environment_url`,
    // not the build log). `site_url` is the fallback for a host that reports
    // no URL; without either, no link is shown rather than one that goes
    // nowhere.
    const siteUrl = resolution.targetUrl || state.config.site_url;

    // When exactly one entry is named, send the editor to THAT entry rather
    // than to the home page — they are being told a specific change is live,
    // so the link should show them that change. Only in the named case: a
    // grouped "3 changes are live" has no single page to point at.
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
