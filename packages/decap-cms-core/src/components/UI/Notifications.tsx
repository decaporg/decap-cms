import { useEffect, useState } from 'react';
// import { translate } from 'react-polyglot';
import { injectStyle } from 'react-toastify/dist/inject-style';
import { toast, ToastContainer } from 'react-toastify';
import { connect, useDispatch } from 'react-redux';
import { useTranslate } from 'react-polyglot';

import { dismissNotification } from '../../actions/notifications';

import type { ReactNode } from 'react';
import type { Id, ToastItem } from 'react-toastify';
import type { State } from '../../types/redux';
import type { Notification } from '../../reducers/notifications';

injectStyle();

interface Props {
  notifications: Notification[];
}

type Entry = {
  toastId: Id;
  /** What was last rendered; immer keeps unchanged objects, so identity is the change check. */
  notification: Notification;
  /** Held so an update can cancel it, e.g. a timed toast later held open. */
  dismissTimer: ReturnType<typeof setTimeout> | null;
  /** The timeout that timer was armed for, so an unchanged one is left alone. */
  dismissAfter: number | false | undefined;
};

type IdMap = {
  [id: string]: Entry;
};

type Translate = ReturnType<typeof useTranslate>;

function translateMessage(message: Notification['message'], t: Translate) {
  return typeof message === 'string' ? message : t(message.key, { ...message });
}

function renderNotification(notification: Notification, t: Translate): ReactNode {
  const message = translateMessage(notification.message, t);

  if (!notification.link) {
    return message;
  }

  return (
    <>
      {message}{' '}
      <a
        href={notification.link.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}
      >
        {translateMessage(notification.link.label, t)}
      </a>
    </>
  );
}

function Notifications({ notifications }: Props) {
  const t = useTranslate();
  const dispatch = useDispatch();
  const [idMap, setIdMap] = useState<IdMap>({});

  useEffect(() => {
    function scheduleDismiss(entry: Entry, notification: Notification) {
      if (entry.dismissTimer !== null && entry.dismissAfter === notification.dismissAfter) {
        return;
      }

      if (entry.dismissTimer !== null) {
        clearTimeout(entry.dismissTimer);
        entry.dismissTimer = null;
      }

      entry.dismissAfter = notification.dismissAfter;
      if (!notification.dismissAfter) {
        return;
      }

      entry.dismissTimer = setTimeout(() => {
        dispatch(dismissNotification(notification.id));
      }, notification.dismissAfter as number);
    }

    notifications
      .filter(notification => !idMap[notification.id])
      .forEach(notification => {
        const toastId = toast(renderNotification(notification, t), {
          autoClose: notification.dismissAfter,
          type: notification.type,
          isLoading: notification.spinner,
        });

        const entry: Entry = {
          toastId,
          notification,
          dismissTimer: null,
          dismissAfter: undefined,
        };
        idMap[notification.id] = entry;
        setIdMap(idMap);

        scheduleDismiss(entry, notification);
      });

    // A notification that changed in place — one job reporting its stages
    // through a single toast rather than stacking one per stage.
    notifications.forEach(notification => {
      const entry = idMap[notification.id];
      if (!entry || entry.notification === notification) {
        return;
      }

      entry.notification = notification;
      toast.update(entry.toastId, {
        render: renderNotification(notification, t),
        type: notification.type,
        autoClose: notification.dismissAfter,
        // Explicitly false rather than undefined: a toast created as a
        // spinner stays one otherwise, and no autoClose applies while it is.
        isLoading: notification.spinner ?? false,
      });

      scheduleDismiss(entry, notification);
    });

    Object.entries(idMap).forEach(([id, entry]) => {
      if (!notifications.find(notification => notification.id === id)) {
        toast.dismiss(entry.toastId);
        if (entry.dismissTimer !== null) {
          clearTimeout(entry.dismissTimer);
        }
        delete idMap[id];
        setIdMap(idMap);
      }
    });
  }, [notifications]);

  toast.onChange((payload: ToastItem) => {
    if (payload.status == 'removed') {
      const id = Object.entries(idMap).find(([, entry]) => entry.toastId === payload.id)?.[0];
      if (id) {
        dispatch(dismissNotification(id));
      }
    }
  });

  return (
    <>
      <ToastContainer
        position="top-right"
        theme="colored"
        className="notif__container"
        closeOnClick
        draggable
      />
    </>
  );
}

function mapStateToProps({ notifications }: State): Props {
  return { notifications: notifications.notifications };
}

export default connect(mapStateToProps)(Notifications);
