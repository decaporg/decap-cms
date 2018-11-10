import React from 'react';
import cn from 'classnames';

const Notification = ({ url, loud, children }) => (
  <a href={url} className={cn('notification', { 'notification-loud': loud })}>
    {children}
  </a>
);

export default Notification;
