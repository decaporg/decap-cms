import React from 'react';
import { toast } from 'react-toastify';

import Toast from '../Toast';

function addNotification({ type, title, content }) {
  toast(<Toast type={type} title={title} content={content} />, {
    autoClose: 5000,
  });
}

function dismissNotification(id) {
  toast.dismiss({ id });
}

function clearNotifications() {
  toast.dismiss();
}

export { addNotification, dismissNotification, clearNotifications };
