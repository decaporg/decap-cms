import { currentBackend } from '../backend';
import { addNotification, dismissNotification, updateNotification } from './notifications';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';

/**
 * Post-save deploy notifications. See decap-turbo/docs/deploy-status-plan.md §A4.
 *
 * A save tells the editor their entry was committed; it does not tell them
 * whether the site they publish has actually rebuilt. This turns the one-shot
 * "Entry saved" toast into a single toast that follows the deploy — but only
 * where a backend can report one, and only for as long as it keeps reporting.
 *
 * The watching itself belongs to the backend (Turbo polls its own
 * `site_deployments` table), so this is deliberately duck-typed: a backend
 * that has no `watchDeploy` gets exactly today's behaviour, with no import
 * relationship between core and any particular backend.
 */

type DeployWatchStatus =
  | 'pending'
  | 'building'
  | 'success'
  | 'failed'
  | 'canceled'
  /** No deploy was ever reported — the ordinary case for a site with no hook. */
  | 'absent'
  /** One was reported and then never finished. */
  | 'timeout';

interface DeployWatchUpdate {
  status: DeployWatchStatus;
  deployment: {
    target_url: string | null;
    provider_label: string | null;
    error_message: string | null;
  } | null;
  commitSha: string;
  entryPath?: string;
}

interface DeployWatchingBackend {
  watchDeploy?: (
    listener: (update: DeployWatchUpdate) => void,
    options?: { commitSha?: string; entryPath?: string },
  ) => (() => void) | null;
}

/**
 * The toast the current watch is driving, so a second save replaces the first
 * one's toast instead of leaving a stale "Publishing…" next to a fresh one.
 *
 * Module state rather than store state on purpose: the watcher it mirrors is
 * itself a single backend-held object, and a reducer entry would have to be
 * kept in step with something the store cannot see.
 */
let activeDeployNotificationId: string | null = null;

/**
 * Announces a completed save, and follows its deploy when the backend can
 * report one.
 *
 * Replaces the plain `Entry saved` toast at the one call site that publishes
 * directly. Editorial workflow keeps the plain toast: saving there creates an
 * unpublished change, which by definition has not deployed.
 */
export function notifyEntrySaved() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const backend = currentBackend(getState().config);
    const implementation = backend.implementation as unknown as DeployWatchingBackend;

    const notificationId = crypto.randomUUID();

    // Started before the toast exists, and safely so: the first read is a
    // network round trip, so no update can arrive until well after this
    // function returns. Starting it second would mean either showing a
    // "Publishing…" toast we may have to retract, or asking the backend the
    // same question twice.
    const stopWatch =
      typeof implementation?.watchDeploy === 'function'
        ? implementation.watchDeploy(update => dispatch(applyDeployUpdate(notificationId, update)))
        : null;

    if (!stopWatch) {
      dispatch(
        addNotification({
          message: { key: 'ui.toast.entrySaved' },
          type: 'success',
          dismissAfter: 4000,
        }),
      );
      return;
    }

    if (activeDeployNotificationId) {
      dispatch(dismissNotification(activeDeployNotificationId));
    }
    activeDeployNotificationId = notificationId;

    dispatch(
      addNotification({
        id: notificationId,
        message: { key: 'ui.toast.entryPublishing' },
        type: 'info',
        // Held open, not timed: this toast is going to be updated, and a
        // deploy takes longer than any dismissal we could pick for it.
        dismissAfter: false,
        spinner: true,
      }),
    );
  };
}

function applyDeployUpdate(notificationId: string, update: DeployWatchUpdate) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const deployment = update.deployment;

    switch (update.status) {
      // "Saved · Publishing…" already says exactly this.
      case 'pending':
        return;

      case 'building':
        dispatch(
          updateNotification(notificationId, {
            message: { key: 'ui.toast.entryBuilding' },
            type: 'info',
            dismissAfter: false,
            spinner: true,
          }),
        );
        return;

      case 'success': {
        // The deploy's own URL is the live site (verified in §A2 — it is
        // `environment_url`, not the build log). `site_url` is the fallback for
        // a host that reports no URL at all; without either, no link is shown
        // rather than a link that goes nowhere.
        const url = deployment?.target_url || getState().config.site_url;
        finish(dispatch, notificationId, {
          message: { key: 'ui.toast.entryLive' },
          type: 'success',
          dismissAfter: 8000,
          spinner: false,
          link: url ? { url, label: { key: 'ui.toast.viewSite' } } : undefined,
        });
        return;
      }

      case 'failed':
        finish(dispatch, notificationId, {
          message: { key: 'ui.toast.entryDeployFailed' },
          type: 'error',
          // Held open: this is the one outcome the editor has to act on, and
          // the action is the link inside the toast. Dismissible by click.
          dismissAfter: false,
          spinner: false,
          link: deployment?.target_url
            ? { url: deployment.target_url, label: { key: 'ui.toast.viewBuildLog' } }
            : undefined,
        });
        return;

      // absent, timeout, canceled: nothing true can be said about a deploy, so
      // collapse to what is certainly true — the entry was saved. A canceled
      // deploy belongs here rather than with failures: nobody's change broke,
      // someone stopped a build.
      default:
        finish(dispatch, notificationId, {
          message: { key: 'ui.toast.entrySaved' },
          type: 'success',
          dismissAfter: 4000,
          spinner: false,
          link: undefined,
        });
    }
  };
}

/** Last update for this watch: stop treating its toast as the live one. */
function finish(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  notificationId: string,
  payload: Parameters<typeof updateNotification>[1],
) {
  if (activeDeployNotificationId === notificationId) {
    activeDeployNotificationId = null;
  }
  dispatch(updateNotification(notificationId, payload));
}

/** Test seam — module state must not leak between cases. */
export function resetDeployNotificationState() {
  activeDeployNotificationId = null;
}
