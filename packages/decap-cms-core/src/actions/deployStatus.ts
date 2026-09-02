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

interface DeployResolution {
  /** `live` — a deploy containing the change succeeded. `failed` — one containing it failed. */
  status: 'live' | 'failed';
  entries: Array<{ entryPath: string; entryLabel?: string }>;
  targetUrl: string | null;
}

interface DeployWatchingBackend {
  subscribeDeployResolutions?: (
    listener: (resolution: DeployResolution) => void,
  ) => (() => void) | null;
  recordSaveForDeployWatch?: (entryLabel?: string) => boolean;
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
  saveNotificationId = null;
}

/**
 * Announces a completed save, and asks the backend to watch for the deploy
 * that carries it.
 *
 * Replaces the plain `Entry saved` toast at the one call site that publishes
 * directly. Editorial workflow keeps the plain toast: saving there creates an
 * unpublished change, which by definition has not deployed.
 */
export function notifyEntrySaved(entryLabel?: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const implementation = backendFor(getState);

    // Idempotent, and here as well as at mount so a backend that becomes
    // available later still gets subscribed.
    dispatch(startDeployNotifications());

    const watching =
      typeof implementation?.recordSaveForDeployWatch === 'function' &&
      implementation.recordSaveForDeployWatch(entryLabel);

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
            // The deploy's own URL is the live site (§A2 — it is
            // `environment_url`, not the build log). `site_url` is the
            // fallback for a host that reports no URL; without either, no link
            // is shown rather than one that goes nowhere.
            link: linkTo(resolution.targetUrl || state.config.site_url, 'ui.toast.viewSite'),
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
