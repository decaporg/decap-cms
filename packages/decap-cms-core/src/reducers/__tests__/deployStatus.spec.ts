import deployStatus, { selectDeployStatusVisible } from '../deployStatus';
import {
  DEPLOY_STATUS_UPDATE,
  DEPLOY_HISTORY_REQUEST,
  DEPLOY_HISTORY_SUCCESS,
  DEPLOY_HISTORY_FAILURE,
} from '../../actions/deployStatus';

import type { DeploymentRow } from '../../actions/deployStatus';

function row(overrides: Partial<DeploymentRow> = {}): DeploymentRow {
  return {
    commit_sha: 'abc1234',
    source: 'webhook',
    external_id: 'deploy-1',
    provider_label: 'Netlify',
    state: 'success',
    target_url: 'https://example.com',
    error_message: null,
    started_at: null,
    finished_at: '2026-09-02T10:00:00.000Z',
    updated_at: '2026-09-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('deployStatus reducer', () => {
  it('starts hidden', () => {
    const state = deployStatus(undefined, {} as never);

    expect(state).toMatchObject({ supported: false, pageEnabled: false, pendingCount: 0 });
    expect(selectDeployStatusVisible(state)).toBe(false);
  });

  it('tracks pending saves and the latest deploy', () => {
    const state = deployStatus(undefined, {
      type: DEPLOY_STATUS_UPDATE,
      payload: { pendingCount: 2, latest: row(), supported: true, pageEnabled: true },
    } as never);

    expect(state.pendingCount).toBe(2);
    expect(state.latest).toMatchObject({ commit_sha: 'abc1234' });
    expect(selectDeployStatusVisible(state)).toBe(true);
  });

  // The poll's window is bounded by the oldest pending save, so an older
  // deploy legitimately falls out of it. Forgetting it would blank the pill.
  it('does not erase a known deploy when an update carries none', () => {
    const withDeploy = deployStatus(undefined, {
      type: DEPLOY_STATUS_UPDATE,
      payload: { pendingCount: 0, latest: row(), supported: true, pageEnabled: true },
    } as never);

    const after = deployStatus(withDeploy, {
      type: DEPLOY_STATUS_UPDATE,
      payload: { pendingCount: 1, latest: null },
    } as never);

    expect(after.latest).toMatchObject({ commit_sha: 'abc1234' });
    expect(after.pendingCount).toBe(1);
  });

  it('stays hidden while the backend supports it but nothing has deployed', () => {
    // Auto-hide (§A7): a site whose host reports nothing must look like a CMS
    // without the feature, not one with a permanently empty page.
    const state = deployStatus(undefined, {
      type: DEPLOY_STATUS_UPDATE,
      payload: { pendingCount: 0, latest: null, supported: true, pageEnabled: true },
    } as never);

    expect(selectDeployStatusVisible(state)).toBe(false);
  });

  it('appears as soon as a save is outstanding, before any deploy is known', () => {
    const state = deployStatus(undefined, {
      type: DEPLOY_STATUS_UPDATE,
      payload: { pendingCount: 1, latest: null, supported: true, pageEnabled: true },
    } as never);

    expect(selectDeployStatusVisible(state)).toBe(true);
  });

  it('stays hidden when the page is configured off', () => {
    const state = deployStatus(undefined, {
      type: DEPLOY_STATUS_UPDATE,
      payload: { pendingCount: 1, latest: row(), supported: true, pageEnabled: false },
    } as never);

    expect(selectDeployStatusVisible(state)).toBe(false);
  });

  it('records history and takes the newest row as latest', () => {
    const state = deployStatus(undefined, {
      type: DEPLOY_HISTORY_SUCCESS,
      payload: { deployments: [row({ commit_sha: 'newest' }), row({ commit_sha: 'older' })] },
    } as never);

    expect(state.deployments).toHaveLength(2);
    expect(state.latest).toMatchObject({ commit_sha: 'newest' });
    expect(state.loaded).toBe(true);
    expect(state.isFetching).toBe(false);
  });

  it('clears a previous error when a new read starts', () => {
    const failed = deployStatus(undefined, {
      type: DEPLOY_HISTORY_FAILURE,
      payload: { error: 'boom' },
    } as never);
    expect(failed.error).toBe('boom');

    expect(deployStatus(failed, { type: DEPLOY_HISTORY_REQUEST } as never)).toMatchObject({
      isFetching: true,
      error: null,
    });
  });

  // An empty list after a failure means "we do not know", not "this site has
  // never deployed", and the page says different things for the two.
  it('leaves `loaded` false after a failure', () => {
    const state = deployStatus(undefined, {
      type: DEPLOY_HISTORY_FAILURE,
      payload: { error: 'offline' },
    } as never);

    expect(state.loaded).toBe(false);
    expect(state.deployments).toEqual([]);
  });
});
