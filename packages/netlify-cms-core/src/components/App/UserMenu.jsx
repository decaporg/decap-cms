import React, { useState } from 'react';
import { AvatarButton, Menu, MenuItem, useUIContext } from 'netlify-cms-ui-default';

const UserMenu = ({ className, onLogoutClick }) => {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const { darkMode, setDarkMode } = useUIContext();

  return (
    <>
      <AvatarButton
        src="https://randomuser.me/api/portraits/men/1.jpg"
        onClick={e => setUserMenuAnchorEl(e.currentTarget)}
        active={!!userMenuAnchorEl}
        className={className}
      />
      <Menu
        anchorEl={userMenuAnchorEl}
        open={!!userMenuAnchorEl}
        onClose={() => setUserMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        <MenuItem
          icon="moon"
          selected={darkMode}
          onClick={() => {
            setDarkMode(!darkMode);
            setUserMenuAnchorEl(null);
          }}
        >
          Dark Mode
        </MenuItem>
        <MenuItem
          icon="help-circle"
          onClick={() => {
            window.open('https://www.netlifycms.org/community/');
            setUserMenuAnchorEl(null);
          }}
        >
          Help
        </MenuItem>
        <MenuItem
          icon="file-text"
          onClick={() => {
            window.open('https://www.netlifycms.org/docs/');
            setUserMenuAnchorEl(null);
          }}
        >
          Documentation
        </MenuItem>
        <MenuItem
          icon="alert-triangle"
          onClick={() => {
            window.open('https://github.com/netlify/netlify-cms/issues');
            setUserMenuAnchorEl(null);
          }}
        >
          Report an issue
        </MenuItem>
        <MenuItem
          icon="log-out"
          onClick={() => {
            setUserMenuAnchorEl(null);
            onLogoutClick();
          }}
        >
          Log out
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
