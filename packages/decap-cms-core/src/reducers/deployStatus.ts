import { produce } from 'immer';

import {
  DEPLOY_STATUS_UPDATE,
  DEPLOY_HISTORY_REQUEST,
  DEPLOY_HISTORY_SUCCESS,
  DEPLOY_HISTORY_FAILURE,
} from '../actions/deployStatus';

import type { DeployStatusAction, Deployment } from '../actions/deployStatus';

/**
 * Deploy status: the header pill and the Deploys page. Distinct from the older
 * `deploys` slice, which holds deploy PREVIEW links for unpublished entries.
 */
export type DeployStatusState = {
  /** Saves this browser has made that no deploy has accounted for yet. */
  pendingCount: number;
  /** Most recent deployment seen, in any state. Null until one is read. */
  latest: Deployment | null;
  /** History, newest first — only populated once something asks for it. */
  deployments: Deployment[];
  /** The branch the site publishes from; null makes every row a candidate for "Live". */
  branch: string | null;
  /** What each commit saved, keyed by sha, across editors. */
  entryLabels: Record<string, string>;
  isFetching: boolean;
  error: string | null;
  /** Whether the backend can report deploys at all; false keeps every surface hidden. */
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
  branch: null,
  entryLabels: {},
  isFetching: false,
  error: null,
  supported: false,
  pageEnabled: false,
  loaded: false,
};

/**
 * The rows that describe the site itself. A row naming no branch is kept, since
 * some hosts report none.
 */
export function onSiteBranch(deployments: Deployment[], branch: string | null) {
  if (!branch) {
    return deployments;
  }
  return deployments.filter(row => !row.branch || row.branch === branch);
}

const deployStatus = produce((state: DeployStatusState, action: DeployStatusAction) => {
  switch (action.type) {
    case DEPLOY_STATUS_UPDATE: {
      const { pendingCount, latest, supported, pageEnabled, branch } = action.payload;
      state.pendingCount = pendingCount;
      if (branch !== undefined) {
        state.branch = branch;
      }
      // An empty poll must not erase what we knew: its window is bounded.
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
      // The history is unscoped; `latest` is the state of the site, which a
      // branch deploy of an unpublished entry is not.
      state.latest = onSiteBranch(action.payload.deployments, state.branch)[0] ?? state.latest;
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
      // `loaded` stays false: after a failure an empty list means "unknown".
      state.error = action.payload.error;
      break;
  }
}, defaultState);

/**
 * Auto-hide: the nav item and the route exist only once this site has produced
 * deploy information, so a silent host looks like a CMS without the feature.
 */
export function selectDeployStatusVisible(state: DeployStatusState) {
  return (
    state.supported &&
    state.pageEnabled &&
    // `deployments` too: `latest` is branch-scoped, and a host that only
    // reports branch deploys still has a page worth showing.
    (state.latest !== null || state.deployments.length > 0 || state.pendingCount > 0)
  );
}

export default deployStatus;
