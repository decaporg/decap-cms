import { produce } from 'immer';

import {
  DEPLOY_STATUS_UPDATE,
  DEPLOY_HISTORY_REQUEST,
  DEPLOY_HISTORY_SUCCESS,
  DEPLOY_HISTORY_FAILURE,
} from '../actions/deployStatus';

import type { DeployStatusAction, DeploymentRow } from '../actions/deployStatus';

/**
 * Deploy status — the header pill and the Deploys page.
 * See decap-turbo/docs/deploy-status-plan.md §A8.
 *
 * Distinct from the older `deploys` slice, which is deploy PREVIEW links for
 * unpublished editorial-workflow entries. Previews answer "what would this
 * look like"; this answers "has what I published actually shipped".
 */
export type DeployStatusState = {
  /** Saves this browser has made that no deploy has accounted for yet. */
  pendingCount: number;
  /** Most recent deployment seen, in any state. Null until one is read. */
  latest: DeploymentRow | null;
  /** History, newest first — only populated once something asks for it. */
  deployments: DeploymentRow[];
  /**
   * What each commit saved, keyed by sha. Shared across editors, unlike the
   * watcher's own ledger, so a colleague's save is named too.
   */
  entryLabels: Record<string, string>;
  isFetching: boolean;
  error: string | null;
  /**
   * Whether the backend can report deploys at all. False keeps every surface
   * hidden, which is the correct default for a site whose host says nothing —
   * see §A7 on auto-hide.
   */
  supported: boolean;
  /** Whether the /deploys route and nav item are configured on. */
  pageEnabled: boolean;
  /** True once a history read has completed, so an empty list can be trusted. */
  loaded: boolean;
};

const defaultState: DeployStatusState = {
  pendingCount: 0,
  latest: null,
  deployments: [],
  entryLabels: {},
  isFetching: false,
  error: null,
  supported: false,
  pageEnabled: false,
  loaded: false,
};

const deployStatus = produce((state: DeployStatusState, action: DeployStatusAction) => {
  switch (action.type) {
    case DEPLOY_STATUS_UPDATE: {
      const { pendingCount, latest, supported, pageEnabled } = action.payload;
      state.pendingCount = pendingCount;
      // A poll that returns nothing must not erase what we already knew: the
      // window it reads is bounded by the oldest pending save, so an older
      // deploy legitimately falls out of it.
      if (latest) {
        state.latest = latest;
      }
      if (supported !== undefined) {
        state.supported = supported;
      }
      if (pageEnabled !== undefined) {
        state.pageEnabled = pageEnabled;
      }
      break;
    }

    case DEPLOY_HISTORY_REQUEST:
      state.isFetching = true;
      state.error = null;
      break;

    case DEPLOY_HISTORY_SUCCESS: {
      state.isFetching = false;
      state.loaded = true;
      state.deployments = action.payload.deployments;
      state.latest = action.payload.deployments[0] ?? state.latest;
      state.entryLabels = {};
      for (const commit of action.payload.commits ?? []) {
        if (commit.entry_label) {
          state.entryLabels[commit.commit_sha] = commit.entry_label;
        }
      }
      break;
    }

    case DEPLOY_HISTORY_FAILURE:
      state.isFetching = false;
      // `loaded` deliberately stays false: an empty list after a failure means
      // "we do not know", and the page must say so rather than claim the site
      // has never deployed.
      state.error = action.payload.error;
      break;
  }
}, defaultState);

/**
 * Auto-hide, and the whole of §A7's default: the nav item and the route exist
 * only once this site has actually produced deploy information. A site whose
 * host reports nothing — every Netlify site without the webhook of §A6 —
 * should look like a CMS without the feature, not like one with a permanently
 * empty page.
 */
export function selectDeployStatusVisible(state: DeployStatusState) {
  return state.supported && state.pageEnabled && (state.latest !== null || state.pendingCount > 0);
}

export default deployStatus;
