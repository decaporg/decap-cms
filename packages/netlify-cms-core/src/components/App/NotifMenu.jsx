import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from 'netlify-cms-ui-default';

const NotifMenu = ({ className }) => {
  const [notifMenuAnchorEl, setNotifMenuAnchorEl] = useState(null);

  return (
    <>
      <IconButton
        icon="bell"
        onClick={e => setNotifMenuAnchorEl(e.currentTarget)}
        className={className}
        active={!!notifMenuAnchorEl}
      />
      <Menu
        anchorEl={notifMenuAnchorEl}
        open={!!notifMenuAnchorEl}
        onClose={() => setNotifMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        <MenuItem onClick={() => setNotifMenuAnchorEl(null)}>No new notifications</MenuItem>
      </Menu>
    </>
  );
};

export default NotifMenu;
