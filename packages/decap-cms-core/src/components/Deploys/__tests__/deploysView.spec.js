import { DEPLOY_STATE_COLORS } from '../../App/deployStatusIndicator';
import {
  branchOf,
  formatTime,
  liveDeployIds,
  rowId,
  stateColorFor,
  stateKeyFor,
  summaryFor,
  targetOf,
  whereOf,
} from '../deploysView';

const NOW = Date.parse('2026-09-02T12:00:00.000Z');
const LONG_AGO = '2026-09-02T11:00:00.000Z';
const JUST_NOW = '2026-09-02T11:59:00.000Z';

function row(overrides = {}) {
  return {
    commit_sha: 'abc1234def5678',
    source: 'webhook',
    external_id: 'deploy-1',
    provider_label: 'Netlify',
    state: 'success',
    finished_at: '2026-09-02T10:00:00.000Z',
    updated_at: '2026-09-02T10:00:00.000Z',
    ...overrides,
  };
}

describe('formatTime', () => {
  it('is blank for a missing or unparseable time', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime('not a date')).toBe('');
  });

  it('formats a valid time', () => {
    expect(formatTime('2026-09-02T10:00:00.000Z')).not.toBe('');
  });
});

describe('summaryFor', () => {
  // An editor with a save in flight is asking about that save.
  it('reports publishing ahead of a finished deploy', () => {
    expect(summaryFor(2, row(), NOW)).toEqual({
      key: 'ui.deploys.summaryPublishing',
      options: { count: 2 },
    });
  });

  it('says live, failed or building from the latest deploy', () => {
    expect(summaryFor(0, row(), NOW).key).toBe('ui.deploys.summaryLive');
    expect(summaryFor(0, row({ state: 'failed' }), NOW).key).toBe('ui.deploys.summaryFailed');
    expect(summaryFor(0, row({ state: 'pending', updated_at: JUST_NOW }), NOW).key).toBe(
      'ui.deploys.summaryBuilding',
    );
  });

  it('does not know when there is no deploy or the build went quiet', () => {
    expect(summaryFor(0, null, NOW).key).toBe('ui.deploys.summaryUnknown');
    expect(summaryFor(0, row({ state: 'building', updated_at: LONG_AGO }), NOW).key).toBe(
      'ui.deploys.summaryUnknown',
    );
  });
});

describe('targetOf', () => {
  it('prefers the host label', () => {
    expect(targetOf(row())).toBe('Netlify');
  });

  it('names the git forge rather than saying "Git provider"', () => {
    expect(targetOf(row({ source: 'github_deployment', provider_label: null }))).toBe('GitHub');
    expect(targetOf(row({ source: 'gitlab_pipeline', provider_label: null }))).toBe('GitLab');
    expect(targetOf(row({ provider_label: null }))).toBe('Webhook');
  });
});

describe('rowId and branchOf', () => {
  it('identifies a row by source and external id', () => {
    expect(rowId(row())).toBe('webhook:deploy-1');
  });

  it('treats a missing branch as the empty branch', () => {
    expect(branchOf(row({ branch: null }))).toBe('');
    expect(branchOf(row({ branch: 'main' }))).toBe('main');
  });
});

describe('liveDeployIds', () => {
  // A failed build does not take the site down: the last success still serves.
  it('keeps the last success live when a newer deploy failed', () => {
    const live = liveDeployIds([
      row({ external_id: 'newest', state: 'failed' }),
      row({ external_id: 'older' }),
      row({ external_id: 'oldest' }),
    ]);

    expect([...live]).toEqual(['webhook:older']);
  });

  it('marks the newest success of each branch', () => {
    const live = liveDeployIds([
      row({ external_id: 'workflow-new', branch: 'cms/posts/some-entry' }),
      row({ external_id: 'workflow-old', branch: 'cms/posts/some-entry' }),
      row({ external_id: 'site', branch: 'turbo' }),
    ]);

    expect([...live]).toEqual(['webhook:workflow-new', 'webhook:site']);
  });

  // Otherwise a host that reports no branch would have every success live, or none.
  it('groups branchless rows together and still lets one be live', () => {
    const live = liveDeployIds([
      row({ external_id: 'newest', branch: null }),
      row({ external_id: 'older', branch: null }),
    ]);

    expect([...live]).toEqual(['webhook:newest']);
  });
});

describe('stateKeyFor', () => {
  const liveIds = new Set(['webhook:live']);

  it('splits a success into live and deployed', () => {
    expect(stateKeyFor(row({ external_id: 'live' }), liveIds, NOW)).toBe('ui.deploys.state.live');
    expect(stateKeyFor(row({ external_id: 'old' }), liveIds, NOW)).toBe(
      'ui.deploys.state.deployed',
    );
  });

  it('calls a quiet build stalled and a reported one building', () => {
    expect(stateKeyFor(row({ state: 'building', updated_at: LONG_AGO }), liveIds, NOW)).toBe(
      'ui.deploys.state.stalled',
    );
    expect(stateKeyFor(row({ state: 'building', updated_at: JUST_NOW }), liveIds, NOW)).toBe(
      'ui.deploys.state.building',
    );
  });

  it('passes other host states through', () => {
    expect(stateKeyFor(row({ state: 'canceled' }), liveIds, NOW)).toBe('ui.deploys.state.canceled');
  });
});

describe('stateColorFor', () => {
  it('colours a quiet build as stalled, otherwise by state', () => {
    expect(stateColorFor(row({ state: 'building', updated_at: LONG_AGO }), NOW)).toBe(
      DEPLOY_STATE_COLORS.stalled,
    );
    expect(stateColorFor(row({ state: 'failed' }), NOW)).toBe(DEPLOY_STATE_COLORS.failed);
  });
});

describe('whereOf', () => {
  it('shows branch and environment together when they differ', () => {
    expect(whereOf(row({ branch: 'main', environment: 'production' }))).toBe('main · production');
  });

  // "main · main" reads as noise where "main" already said it.
  it('does not repeat the branch when the environment adds nothing', () => {
    expect(whereOf(row({ branch: 'main', environment: 'main' }))).toBe('main');
  });

  it('shows whichever half it has, or a dash', () => {
    expect(whereOf(row({ branch: 'turbo', environment: null }))).toBe('turbo');
    expect(whereOf(row({ branch: null, environment: 'production' }))).toBe('production');
    expect(whereOf(row())).toBe('—');
  });
});
