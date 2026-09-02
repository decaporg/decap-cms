import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { currentBackend } from '../../backend';
import { notifyEntrySaved, resetDeployNotificationState } from '../deployStatus';
import { NOTIFICATION_DISMISS, NOTIFICATION_SEND, NOTIFICATION_UPDATE } from '../notifications';

jest.mock('../../backend');

const mockStore = configureMockStore([thunk]);

type DeployListener = (update: unknown) => void;

/** Stands in for the backend's own watcher — the test drives it by hand. */
function backendWithWatch(canWatch = true) {
  let listener: DeployListener | null = null;
  const stop = jest.fn();
  const watchDeploy = jest.fn((cb: DeployListener) => {
    listener = cb;
    return canWatch ? stop : null;
  });

  return {
    backend: { implementation: { watchDeploy } },
    watchDeploy,
    stop,
    deliver: (update: unknown) => listener!(update),
  };
}

function deployment(overrides: Record<string, unknown> = {}) {
  return { target_url: null, provider_label: 'Netlify', error_message: null, ...overrides };
}

function storeWith(siteUrl?: string) {
  return mockStore({ config: siteUrl ? { site_url: siteUrl } : {} });
}

function sent(store: ReturnType<typeof mockStore>) {
  return store.getActions().filter(action => action.type === NOTIFICATION_SEND);
}

function updates(store: ReturnType<typeof mockStore>) {
  return store.getActions().filter(action => action.type === NOTIFICATION_UPDATE);
}

const mockedCurrentBackend = currentBackend as unknown as jest.Mock;

describe('notifyEntrySaved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDeployNotificationState();
  });

  // Every backend that is not Turbo, and this must stay exactly as it was.
  it('falls back to the plain saved toast on a backend that cannot watch deploys', () => {
    mockedCurrentBackend.mockReturnValue({ implementation: {} });
    const store = storeWith();

    store.dispatch(notifyEntrySaved());

    expect(sent(store)).toHaveLength(1);
    expect(sent(store)[0].payload).toEqual({
      message: { key: 'ui.toast.entrySaved' },
      type: 'success',
      dismissAfter: 4000,
    });
  });

  // A save with no commit sha, or a backend missing its Supabase config.
  it('falls back to the plain saved toast when the backend declines to watch', () => {
    const { backend } = backendWithWatch(false);
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());

    expect(sent(store)[0].payload.message).toEqual({ key: 'ui.toast.entrySaved' });
    expect(sent(store)[0].payload.spinner).toBeUndefined();
  });

  it('opens one held-open toast and follows the deploy through it', () => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());

    const opened = sent(store)[0].payload;
    expect(opened.message).toEqual({ key: 'ui.toast.entryPublishing' });
    expect(opened.dismissAfter).toBe(false);
    expect(opened.spinner).toBe(true);
    expect(typeof opened.id).toBe('string');

    deliver({ status: 'building', deployment: deployment(), commitSha: 'sha' });
    deliver({
      status: 'success',
      deployment: deployment({ target_url: 'https://site.example' }),
      commitSha: 'sha',
    });

    // One toast, updated twice — not three toasts.
    expect(sent(store)).toHaveLength(1);
    expect(updates(store)).toHaveLength(2);
    expect(updates(store).every(action => action.id === opened.id)).toBe(true);

    expect(updates(store)[0].payload.message).toEqual({ key: 'ui.toast.entryBuilding' });
    expect(updates(store)[1].payload).toMatchObject({
      message: { key: 'ui.toast.entryLive' },
      type: 'success',
      spinner: false,
      link: { url: 'https://site.example', label: { key: 'ui.toast.viewSite' } },
    });
  });

  // "Saved · Publishing…" already says this; re-rendering it would restart the
  // toast for no new information.
  it('says nothing new for a pending deploy', () => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());
    deliver({ status: 'pending', deployment: deployment(), commitSha: 'sha' });

    expect(updates(store)).toHaveLength(0);
  });

  it('falls back to the configured site_url when the deploy reports no URL', () => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith('https://configured.example');

    store.dispatch(notifyEntrySaved());
    deliver({ status: 'success', deployment: deployment(), commitSha: 'sha' });

    expect(updates(store)[0].payload.link).toEqual({
      url: 'https://configured.example',
      label: { key: 'ui.toast.viewSite' },
    });
  });

  it('offers no link at all rather than one that goes nowhere', () => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());
    deliver({ status: 'success', deployment: deployment(), commitSha: 'sha' });

    expect(updates(store)[0].payload.link).toBeUndefined();
  });

  it('reports a failed build as an error the editor can act on', () => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());
    deliver({
      status: 'failed',
      deployment: deployment({ target_url: 'https://logs.example/build/1' }),
      commitSha: 'sha',
    });

    expect(updates(store)[0].payload).toMatchObject({
      message: { key: 'ui.toast.entryDeployFailed' },
      type: 'error',
      dismissAfter: false,
      link: { url: 'https://logs.example/build/1', label: { key: 'ui.toast.viewBuildLog' } },
    });
  });

  // The common case per §A0: no deploy hook, so nothing true can be said about
  // a deploy and the toast must collapse to what is certainly true.
  it.each(['absent', 'timeout', 'canceled'])('collapses to the plain saved toast on %s', status => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith('https://configured.example');

    store.dispatch(notifyEntrySaved());
    deliver({ status, deployment: null, commitSha: 'sha' });

    expect(updates(store)[0].payload).toEqual({
      message: { key: 'ui.toast.entrySaved' },
      type: 'success',
      dismissAfter: 4000,
      spinner: false,
      link: undefined,
    });
  });

  it("replaces the previous save's toast instead of leaving it spinning", () => {
    const { backend } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());
    const first = sent(store)[0].payload.id;
    store.dispatch(notifyEntrySaved());

    const dismissed = store.getActions().filter(action => action.type === NOTIFICATION_DISMISS);
    expect(dismissed).toHaveLength(1);
    expect(dismissed[0].id).toBe(first);
    expect(sent(store)).toHaveLength(2);
  });

  // Once a watch has reported its last word, its toast is no longer the live
  // one — the next save has nothing to dismiss.
  it('does not dismiss a toast that has already finished', () => {
    const { backend, deliver } = backendWithWatch();
    mockedCurrentBackend.mockReturnValue(backend);
    const store = storeWith();

    store.dispatch(notifyEntrySaved());
    deliver({ status: 'success', deployment: deployment(), commitSha: 'sha' });
    store.dispatch(notifyEntrySaved());

    expect(store.getActions().filter(action => action.type === NOTIFICATION_DISMISS)).toHaveLength(
      0,
    );
  });
});
