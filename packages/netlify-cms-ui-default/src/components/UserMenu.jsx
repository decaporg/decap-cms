import React, { useState } from 'react';
import styled from '@emotion/styled';
import Avatar from './Avatar';
import { Menu, MenuItem } from './Menu';

const StyledAvatar = styled(Avatar)`
  margin-left: 0.5rem;
  cursor: pointer;
  transition: 200ms;
  ${({ active, theme }) =>
    active ? `box-shadow: 0 0 0 4px ${theme.color.elevatedSurfaceHighlight}` : ''}
  &:hover {
    opacity: 0.9;
  }
  &:active {
    opacity: 0.75;
  }
`;

const UserMenu = ({ setDarkMode, darkMode }) => {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);

  function handleClose() {
    setUserMenuAnchorEl(null);
  }

  return (
    <>
      <StyledAvatar
        src="https://randomuser.me/api/portraits/men/1.jpg"
        onClick={e => setUserMenuAnchorEl(e.currentTarget)}
        active={!!userMenuAnchorEl}
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
          icon="help-circle"
          onClick={() => {
            window.open('https://www.netlifycms.org/community/');
            handleClose();
          }}
        >
          Help
        </MenuItem>
        <MenuItem
          icon="file-text"
          onClick={() => {
            window.open('https://www.netlifycms.org/docs/');
            handleClose();
          }}
        >
          Documentation
        </MenuItem>
        <MenuItem
          icon="alert-triangle"
          onClick={() => {
            window.open('https://github.com/netlify/netlify-cms/issues');
            handleClose();
          }}
        >
          Report an issue
        </MenuItem>
        <MenuItem icon="log-out" onClick={handleClose}>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
