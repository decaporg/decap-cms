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

  // The capability §A4 needs: one toast that follows a job through its stages,
  // rather than a new toast stacked next to it per stage.
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
});
