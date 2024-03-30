import React, { useState } from 'react';
import { useNotificationCenter } from 'react-toastify/addons/use-notification-center';

import { IconButton } from '../Buttons';
import { Menu, MenuItem } from '../Menu';

function NotificationCenter({ className }) {
  const { notifications, clear, markAllAsRead, markAsRead, unreadCount } = useNotificationCenter();

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  function toggleNotificationCenter(el) {
    setAnchorEl(el);
    setIsOpen(!isOpen);
  }

  function toggleFilter() {
    setShowUnreadOnly(!showUnreadOnly);
  }

  return (
    <>
      <IconButton
        icon="bell"
        onClick={e => toggleNotificationCenter(e.currentTarget)}
        className={className}
        active={!!anchorEl}
      />

      <div className="notification-count">{unreadCount}</div>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => toggleNotificationCenter(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        {!notifications.length || (unreadCount === 0 && showUnreadOnly) ? (
          <MenuItem onClick={() => toggleNotificationCenter(null)}>No new notifications</MenuItem>
        ) : (
          <>
            <MenuItem onClick={markAllAsRead}>Mark all as read</MenuItem>

            <MenuItem onClick={toggleFilter}>
              {showUnreadOnly ? 'Show all notifications' : 'Show unread notifications'}
            </MenuItem>

            {notifications
              .filter(notification => !showUnreadOnly || !notification.read)
              .map(notification => (
                <MenuItem
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    toggleNotificationCenter(null);
                  }}
                >
                  {notification.title}
                  {notification.content}
                  {notification.read ? ' (read)' : '(unread)'}
                </MenuItem>
              ))}

            <MenuItem onClick={clear}>Clear all notifications</MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

export default NotificationCenter;
