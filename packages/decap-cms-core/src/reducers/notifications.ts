import { produce } from 'immer';

import {
  NOTIFICATION_SEND,
  NOTIFICATION_UPDATE,
  NOTIFICATION_DISMISS,
  NOTIFICATIONS_CLEAR,
} from '../actions/notifications';

import type {
  NotificationsAction,
  NotificationLink,
  NotificationMessage,
  NotificationPayload,
} from '../actions/notifications';
import type { TypeOptions } from 'react-toastify';

export type Notification = {
  id: string;
  message: string | NotificationMessage;
  dismissAfter?: number | false;
  type: TypeOptions | undefined;
  link?: NotificationLink;
  spinner?: boolean;
};

export type NotificationsState = {
  notifications: Notification[];
};

const defaultState: NotificationsState = {
  notifications: [],
};

const notifications = produce((state: NotificationsState, action: NotificationsAction) => {
  switch (action.type) {
    case NOTIFICATIONS_CLEAR:
      state.notifications = [];
      break;
    case NOTIFICATION_DISMISS:
      state.notifications = state.notifications.filter(n => n.id !== action.id);
      break;
    case NOTIFICATION_SEND:
      state.notifications = [
        ...state.notifications,
        {
          // The caller may name the id when it intends to update this
          // notification later; otherwise one is minted here as before.
          id: (action.payload as NotificationPayload).id ?? crypto.randomUUID(),
          ...(action.payload as NotificationPayload),
        },
      ];
      break;
    case NOTIFICATION_UPDATE:
      state.notifications = state.notifications.map(notification =>
        notification.id === action.id
          ? { ...notification, ...(action.payload as Partial<NotificationPayload>) }
          : notification,
      );
      break;
  }
}, defaultState);

export default notifications;
