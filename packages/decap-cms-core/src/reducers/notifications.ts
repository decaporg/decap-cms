import { produce } from 'immer';
import { v4 as uuid } from 'uuid';

import {
  NOTIFICATION_SEND,
  NOTIFICATION_DISMISS,
  NOTIFICATIONS_CLEAR,
} from '../actions/notifications';

import type {
  NotificationsAction,
  NotificationMessage,
  NotificationPayload,
} from '../actions/notifications';
import type { TypeOptions } from 'react-toastify';

export type Notification = {
  id: string;
  message: string | NotificationMessage;
  dismissAfter?: number;
  type: TypeOptions | undefined;
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
          id: uuid(),
          ...(action.payload as NotificationPayload),
        },
      ];
      break;
  }
}, defaultState);

export default notifications;
