import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { currentBackend } from '../../backend';
import {
  DEPLOY_STATUS_UPDATE,
  loadDeployHistory,
  notifyEntrySaved,
  startDeployNotifications,
  startDeployStatus,
  stopDeployNotifications,
} from '../deployStatus';
import { NOTIFICATION_SEND, NOTIFICATION_UPDATE } from '../notifications';

jest.mock('../../backend');

const mockStore = configureMockStore([thunk]);
const mockedCurrentBackend = currentBackend as unknown as jest.Mock;

type Resolution = {
  status: 'live' | 'failed';
  entries: Array<{ entryPath: string; entryLabel?: string; entryUrlPath?: string }>;
  targetUrl: string | null;
};

/** Stands in for the backend's ledger-watcher; the test resolves by hand. */
function backendWithWatch({ canWatch = true, canRecord = true } = {}) {
  let listener: ((resolution: Resolution) => void) | null = null;
  const unsubscribe = jest.fn();
  const subscribeDeployResolutions = jest.fn(cb => {
    listener = cb;
    return canWatch ? unsubscribe : null;
  });
  const recordSaveForDeployWatch = jest.fn(() => canRecord);

  return {
    backend: { implementation: { subscribeDeployResolutions, recordSaveForDeployWatch } },
    subscribeDeployResolutions,
    recordSaveForDeployWatch,
    unsubscribe,
    resolve: (resolution: Resolution) => listener!(resolution),
  };
}

function storeWith({
  siteUrl,
  notifications = [],
}: { siteUrl?: string; notifications?: unknown[] } = {}) {
  return mockStore({
    config: siteUrl ? { site_url: siteUrl } : {},
    notifications: { notifications },
  });
}

function sent(store: ReturnType<typeof mockStore>) {
  return store.getActions().filter(action => action.type === NOTIFICATION_SEND);
}

function updates(store: ReturnType<typeof mockStore>) {
  return store.getActions().filter(action => action.type === NOTIFICATION_UPDATE);
}

describe('deploy notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopDeployNotifications();
  });

  // Every backend that is not Turbo, and this must stay exactly as it was.
  it('falls back to the plain saved toast on a backend that cannot watch deploys', () => {
    mockedCurrentBackend.mockReturnValue({ implementation: {} });
    const store = storeWith();

    store.dispatch(notifyEntrySaved('A post'));

    expect(sent(store)).toHaveLength(1);
    expect(sent(store)[0].payload).toMatchObject({
      message: { key: 'ui.toast.entrySaved' },
      type: 'success',
      dismissAfter: 4000,
    });
  });

  // Promising a follow-up that cannot come is worse than silence.
  it('does not promise publishing when the save could not be recorded', () => {
    const { backend } = backendWithWatch({ canRecord: false });
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved('A post'));

    expect(sent(store)[0].payload.message).toEqual({ key: 'ui.toast.entrySaved' });
  });

  // The heart of §A4b: the save toast must not outlive the save.
  it('says "Publishing…" briefly and does not hold the toast open for the build', () => {
    const { backend, recordSaveForDeployWatch } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved('A post'));

    expect(recordSaveForDeployWatch).toHaveBeenCalledWith('A post', undefined);
    expect(sent(store)[0].payload).toMatchObject({
      message: { key: 'ui.toast.entryPublishing' },
      dismissAfter: 4000,
    });
    expect(sent(store)[0].payload.spinner).toBeUndefined();
  });

  it('subscribes once for the whole session, however many saves happen', () => {
    const { backend, subscribeDeployResolutions } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(startDeployNotifications());
    store.dispatch(notifyEntrySaved('A'));
    store.dispatch(notifyEntrySaved('B'));

    expect(subscribeDeployResolutions).toHaveBeenCalledTimes(1);
  });

  it('survives being started before the config resolves', () => {
    mockedCurrentBackend.mockImplementation(() => {
      throw new Error('config not loaded');
    });
    const store = storeWith();

    expect(() => store.dispatch(startDeployNotifications())).not.toThrow();
  });

  it('names the entry when one change goes live, and links to the site', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    resolve({
      status: 'live',
      entries: [{ entryPath: 'posts/a.md', entryLabel: 'A post' }],
      targetUrl: 'https://site.example',
    });

    expect(sent(store)[0].payload).toMatchObject({
      message: { key: 'ui.toast.entryLive', entry: 'A post' },
      type: 'success',
      dismissAfter: 8000,
      link: { url: 'https://site.example', label: { key: 'ui.toast.viewSite' } },
    });
  });

  it('counts them when one deploy carries several changes', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    resolve({
      status: 'live',
      entries: [{ entryPath: 'posts/a.md' }, { entryPath: 'posts/b.md' }],
      targetUrl: 'https://site.example',
    });

    expect(sent(store)).toHaveLength(1);
    expect(sent(store)[0].payload.message).toEqual({ key: 'ui.toast.entriesLive', count: 2 });
  });

  it('falls back to the entry path when the save carried no title', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    resolve({ status: 'live', entries: [{ entryPath: 'posts/a.md' }], targetUrl: null });

    expect(sent(store)[0].payload.message).toEqual({
      key: 'ui.toast.entryLive',
      entry: 'posts/a.md',
    });
  });

  it('falls back to the configured site_url, and offers no link at all without one', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);

    const configured = storeWith({ siteUrl: 'https://configured.example' });
    configured.dispatch(startDeployNotifications());
    resolve({ status: 'live', entries: [{ entryPath: 'a.md' }], targetUrl: null });
    expect(sent(configured)[0].payload.link).toEqual({
      url: 'https://configured.example',
      label: { key: 'ui.toast.viewSite' },
    });

    stopDeployNotifications();
    const bare = storeWith();
    bare.dispatch(startDeployNotifications());
    resolve({ status: 'live', entries: [{ entryPath: 'a.md' }], targetUrl: null });
    expect(sent(bare)[0].payload.link).toBeUndefined();
  });

  it('reports a failed build as an error the editor can act on', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    resolve({
      status: 'failed',
      entries: [{ entryPath: 'posts/a.md', entryLabel: 'A post' }],
      targetUrl: 'https://logs.example/build/1',
    });

    expect(sent(store)[0].payload).toMatchObject({
      message: { key: 'ui.toast.entryDeployFailed' },
      type: 'error',
      dismissAfter: false,
      link: { url: 'https://logs.example/build/1', label: { key: 'ui.toast.viewBuildLog' } },
    });
  });

  // A deploy quick enough to beat the save toast should update it, not stack
  // a second toast beside it.
  it('updates the save toast in place when it is still on screen', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);

    let pending: unknown[] = [];
    const store = mockStore(() => ({
      config: {},
      notifications: { notifications: pending },
    }));

    store.dispatch(notifyEntrySaved('A post'));
    const saveToastId = sent(store)[0].payload.id;
    pending = [{ id: saveToastId, message: { key: 'ui.toast.entryPublishing' }, type: 'success' }];

    resolve({
      status: 'live',
      entries: [{ entryPath: 'a.md' }],
      targetUrl: 'https://site.example',
    });

    expect(updates(store)).toHaveLength(1);
    expect(updates(store)[0].id).toBe(saveToastId);
    expect(sent(store)).toHaveLength(1);
  });

  it('adds a new notification when the save toast has already gone', () => {
    const { backend, resolve } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved('A post'));
    resolve({
      status: 'live',
      entries: [{ entryPath: 'a.md' }],
      targetUrl: 'https://site.example',
    });

    expect(updates(store)).toHaveLength(0);
    expect(sent(store)).toHaveLength(2);
  });
});

describe('deploy notifications — the entry link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopDeployNotifications();
  });

  it('links to the entry itself when one entry is named', () => {
    const watch = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(watch.backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    watch.resolve({
      status: 'live',
      entries: [
        { entryPath: 'content/posts/a.md', entryLabel: 'A post', entryUrlPath: '/blog/a/' },
      ],
      targetUrl: 'https://site.example',
    });

    expect(sent(store)[0].payload).toMatchObject({
      message: { key: 'ui.toast.entryLive', entry: 'A post' },
      link: { url: 'https://site.example/blog/a/', label: { key: 'ui.toast.viewEntry' } },
    });
  });

  it('joins the deploy URL and the entry path without doubling the slash', () => {
    const watch = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(watch.backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    watch.resolve({
      status: 'live',
      entries: [{ entryPath: 'a.md', entryLabel: 'A', entryUrlPath: '/blog/a/' }],
      targetUrl: 'https://site.example/',
    });

    expect(sent(store)[0].payload.link.url).toBe('https://site.example/blog/a/');
  });

  // A grouped "3 changes are live" has no single page to point at.
  it('falls back to the plain site link when several entries are named', () => {
    const watch = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(watch.backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    watch.resolve({
      status: 'live',
      entries: [
        { entryPath: 'a.md', entryUrlPath: '/blog/a/' },
        { entryPath: 'b.md', entryUrlPath: '/blog/b/' },
      ],
      targetUrl: 'https://site.example',
    });

    expect(sent(store)[0].payload.link).toEqual({
      url: 'https://site.example',
      label: { key: 'ui.toast.viewSite' },
    });
  });

  it('falls back to the site link when the collection configures no preview path', () => {
    const watch = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(watch.backend);
    const store = storeWith();
    store.dispatch(startDeployNotifications());

    watch.resolve({
      status: 'live',
      entries: [{ entryPath: 'a.md', entryLabel: 'A' }],
      targetUrl: 'https://site.example',
    });

    expect(sent(store)[0].payload.link.label).toEqual({ key: 'ui.toast.viewSite' });
  });

  it('passes the entry path to the backend so the ledger can keep it', () => {
    const watch = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(watch.backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved('A post', '/blog/a/'));

    expect(watch.recordSaveForDeployWatch).toHaveBeenCalledWith('A post', '/blog/a/');
  });
});

/**
 * Every backend that is not Turbo. None of this feature may reach them: no
 * subscription, no read, no change to the toast they have always shown.
 */
describe('deploy status on a backend that does not support it', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopDeployNotifications();
  });

  const plainBackend = { implementation: { getEntry: jest.fn(), persistEntry: jest.fn() } };

  it('starts no status subscription', () => {
    mockedCurrentBackend.mockReturnValue(plainBackend);
    const store = storeWith();

    store.dispatch(startDeployStatus());

    expect(store.getActions().filter(a => typeof a !== 'function')).toEqual([]);
  });

  it('reads no deploy history', () => {
    mockedCurrentBackend.mockReturnValue(plainBackend);
    const store = storeWith();

    store.dispatch(loadDeployHistory());

    expect(store.getActions().filter(a => typeof a !== 'function')).toEqual([]);
  });

  it('sends exactly the toast it always sent on save', () => {
    mockedCurrentBackend.mockReturnValue(plainBackend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved('A post', '/blog/a/'));

    const payload = sent(store)[0].payload;
    expect(payload.message).toEqual({ key: 'ui.toast.entrySaved' });
    expect(payload.type).toBe('success');
    expect(payload.link).toBeUndefined();
    expect(payload.spinner).toBeUndefined();
  });

  it('survives a backend that cannot be constructed at all', () => {
    mockedCurrentBackend.mockImplementation(() => {
      throw new Error('no config yet');
    });
    const store = storeWith();

    expect(() => store.dispatch(startDeployStatus())).not.toThrow();
    expect(() => store.dispatch(loadDeployHistory())).not.toThrow();
    expect(() => store.dispatch(notifyEntrySaved('A post'))).not.toThrow();
    expect(sent(store)[0].payload.message).toEqual({ key: 'ui.toast.entrySaved' });
  });
});

describe('deploy status configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stopDeployNotifications();
  });

  // The page cannot tell a deploy of the site from a deploy of an editorial-
  // workflow branch without this, and calls the wrong one "Live".
  it('carries the site branch from the backend into the store', () => {
    const subscribeDeployStatus = jest.fn(cb => {
      cb({ pendingCount: 0, latest: null });
      return jest.fn();
    });
    mockedCurrentBackend.mockReturnValue({
      implementation: {
        subscribeDeployStatus,
        listDeployments: jest.fn().mockResolvedValue([]),
        deployStatusConfig: () => ({
          enabled: true,
          page: true,
          primaryTarget: null,
          branch: 'turbo',
        }),
      },
    });
    const store = storeWith();

    store.dispatch(startDeployStatus());

    const update = store.getActions().find(action => action.type === DEPLOY_STATUS_UPDATE);
    expect(update.payload).toMatchObject({ branch: 'turbo', supported: true, pageEnabled: true });
  });

  // Every backend written before the branch existed, and the GitLab mirror
  // until it catches up: null means "do not scope", not "scope to nothing".
  it('reports a null branch when the backend does not name one', () => {
    const subscribeDeployStatus = jest.fn(cb => {
      cb({ pendingCount: 0, latest: null });
      return jest.fn();
    });
    mockedCurrentBackend.mockReturnValue({
      implementation: {
        subscribeDeployStatus,
        listDeployments: jest.fn().mockResolvedValue([]),
        deployStatusConfig: () => ({ enabled: true, page: true, primaryTarget: null }),
      },
    });
    const store = storeWith();

    store.dispatch(startDeployStatus());

    const update = store.getActions().find(action => action.type === DEPLOY_STATUS_UPDATE);
    expect(update.payload.branch).toBeNull();
  });
});
