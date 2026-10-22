import notifications from '../notifications';
import {
  addNotification,
  clearNotifications,
  dismissNotification,
  updateNotification,
} from '../../actions/notifications';

import type { NotificationsState } from '../notifications';

function stateWith(...items: NotificationsState['notifications']) {
  return { notifications: items };
}

describe('notifications reducer', () => {
  it('mints an id for a notification that did not name one', () => {
    const state = notifications(undefined, addNotification({ message: 'Saved', type: 'success' }));

    expect(state.notifications).toHaveLength(1);
    expect(typeof state.notifications[0].id).toBe('string');
  });

  // A caller that intends to update a notification has to know its id before
  // the reducer would mint one.
  it('keeps an id the caller supplied', () => {
    const state = notifications(
      undefined,
      addNotification({ id: 'save-1', message: 'Publishing', type: 'info' }),
    );

    expect(state.notifications[0].id).toBe('save-1');
  });

  it('merges an update into the notification, leaving the rest alone', () => {
    const before = stateWith(
      { id: 'a', message: 'Publishing', type: 'info', dismissAfter: false, spinner: true },
      { id: 'b', message: 'Something else', type: 'error' },
    );

    const after = notifications(
      before,
      updateNotification('a', {
        message: 'Live',
        type: 'success',
        dismissAfter: 8000,
        spinner: false,
        link: { url: 'https://site.example', label: 'View' },
      }),
    );

    expect(after.notifications[0]).toEqual({
      id: 'a',
      message: 'Live',
      type: 'success',
      dismissAfter: 8000,
      spinner: false,
      link: { url: 'https://site.example', label: 'View' },
    });
    expect(after.notifications[1]).toEqual(before.notifications[1]);
  });

  // The ordinary outcome of the user dismissing a toast mid-job.
  it('ignores an update for an id it no longer holds', () => {
    const before = stateWith({ id: 'a', message: 'Publishing', type: 'info' });

    const after = notifications(before, updateNotification('gone', { message: 'Live' }));

    expect(after.notifications).toEqual(before.notifications);
  });

  it('dismisses by id and clears wholesale', () => {
    const before = stateWith(
      { id: 'a', message: 'One', type: 'info' },
      { id: 'b', message: 'Two', type: 'info' },
    );

    expect(notifications(before, dismissNotification('a')).notifications).toHaveLength(1);
    expect(notifications(before, clearNotifications()).notifications).toHaveLength(0);
  });
});
