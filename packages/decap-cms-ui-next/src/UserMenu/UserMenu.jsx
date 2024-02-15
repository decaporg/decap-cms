import React, { useState } from 'react';

import { AvatarButton } from '../Buttons';
import { Menu, MenuItem } from '../Menu';
import { useUIContext } from '../hooks';

function UserMenu({ user, onLogoutClick, className }) {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const { darkMode, setDarkMode } = useUIContext();

  function handleClose() {
    setUserMenuAnchorEl(null);
  }

  return (
    <>
      <AvatarButton
        src={user?.avatar_url}
        initials={user?.name}
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
            handleClose();
          }}
        >
          Dark Mode
        </MenuItem>
        <MenuItem
          as="a"
          target="_blank"
          href="https://www.decapcms.org/community/"
          icon="help-circle"
          onClick={handleClose}
        >
          Help
        </MenuItem>
        <MenuItem
          as="a"
          target="_blank"
          href="https://www.decapcms.org/docs/"
          icon="file-text"
          onClick={handleClose}
        >
          Documentation
        </MenuItem>
        <MenuItem
          as="a"
          target="_blank"
          href="https://github.com/decaporg/decap-cms/issues"
          icon="alert-triangle"
          onClick={handleClose}
        >
          Report an issue
        </MenuItem>
        <MenuItem icon="log-out" onClick={onLogoutClick}>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}

export default UserMenu;
