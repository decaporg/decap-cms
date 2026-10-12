import { act, render, screen } from '@testing-library/react';
import { I18n } from 'react-polyglot';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import configureStore from 'redux-mock-store';

import Notifications from '../Notifications';

const mockStore = configureStore([]);

describe('Notifications', () => {
  afterEach(() => {
    act(() => toast.dismiss());
  });

  it('renders a success notification', async () => {
    const store = mockStore({
      notifications: {
        notifications: [{ id: '1', message: 'Entry saved', type: 'success' }],
      },
    });

    render(
      <Provider store={store}>
        <I18n locale="en" messages={{}}>
          <Notifications />
        </I18n>
      </Provider>,
    );

    expect(await screen.findByText('Entry saved')).toBeInTheDocument();
  });

  it('renders a notification link as an anchor the editor can follow', async () => {
    const store = mockStore({
      notifications: {
        notifications: [
          {
            id: '1',
            message: 'Your change is live',
            type: 'success',
            link: { url: 'https://site.example', label: 'View' },
          },
        ],
      },
    });

    render(
      <Provider store={store}>
        <I18n locale="en" messages={{}}>
          <Notifications />
        </I18n>
      </Provider>,
    );

    const link = await screen.findByRole('link', { name: 'View' });
    expect(link).toHaveAttribute('href', 'https://site.example');
    expect(link).toHaveAttribute('target', '_blank');
  });

  // A notification created with a timeout and then updated to be held open
  // must not still vanish on the timer armed for its first message — a save
  // toast that turns into a failed build is exactly that case.
  it('cancels a queued dismissal when an update holds the toast open', async () => {
    jest.useFakeTimers();
    let notifications = [
      { id: '1', message: 'Saved · Publishing…', type: 'success', dismissAfter: 4000 },
    ];
    const store = mockStore(() => ({ notifications: { notifications } }));

    render(
      <Provider store={store}>
        <I18n locale="en" messages={{}}>
          <Notifications />
        </I18n>
      </Provider>,
    );

    notifications = [
      { id: '1', message: 'Your site failed to build', type: 'error', dismissAfter: false },
    ];
    act(() => {
      store.dispatch({ type: 'REPAINT' });
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // The dismissal for the 4s message must not have fired for the held-open one.
    expect(store.getActions().filter(a => a.type === 'NOTIFICATION_DISMISS')).toHaveLength(0);
    jest.useRealTimers();
  });

  // One toast follows a job through its stages instead of stacking one per stage.
  it('updates a notification in place instead of stacking a second toast', async () => {
    let notifications = [
      { id: '1', message: 'Saved · Publishing…', type: 'info', dismissAfter: false, spinner: true },
    ];
    const store = mockStore(() => ({ notifications: { notifications } }));

    render(
      <Provider store={store}>
        <I18n locale="en" messages={{}}>
          <Notifications />
        </I18n>
      </Provider>,
    );

    expect(await screen.findByText('Saved · Publishing…')).toBeInTheDocument();

    notifications = [
      {
        id: '1',
        message: 'Your change is live',
        type: 'success',
        dismissAfter: 8000,
        spinner: false,
        link: { url: 'https://site.example', label: 'View' },
      },
    ];
    act(() => {
      store.dispatch({ type: 'REPAINT' });
    });

    expect(await screen.findByText('Your change is live')).toBeInTheDocument();
    expect(screen.queryByText('Saved · Publishing…')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.Toastify__toast')).toHaveLength(1);
  });

  // A failure toast carries the raw error in `details`, and an error can be
  // cyclic (a Response in its metadata, a DOMException); serializing it threw
  // inside the effect and unmounted the CMS on the toast meant to report it.
  it('renders and updates a notification whose details hold a cyclic error', async () => {
    const error = new Error('boom');
    error.self = error;
    const failed = {
      id: '1',
      message: { key: 'ui.toast.failed', details: error },
      type: 'error',
      dismissAfter: false,
    };
    let notifications = [failed];
    const store = mockStore(() => ({ notifications: { notifications } }));

    render(
      <Provider store={store}>
        <I18n
          locale="en"
          messages={{ ui: { toast: { failed: 'It failed', retried: 'Retrying' } } }}
        >
          <Notifications />
        </I18n>
      </Provider>,
    );

    expect(await screen.findByText('It failed')).toBeInTheDocument();

    notifications = [{ ...failed, message: { key: 'ui.toast.retried', details: error } }];
    act(() => {
      store.dispatch({ type: 'REPAINT' });
    });

    expect(await screen.findByText('Retrying')).toBeInTheDocument();
  });
});
