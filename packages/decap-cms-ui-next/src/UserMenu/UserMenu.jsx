import React from 'react';

import { AvatarButton } from '../Buttons';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../Dropdown';
import { useUIContext } from '../hooks';

function UserMenu({ user, onLogoutClick, className }) {
  const { darkMode, setDarkMode } = useUIContext();

  return (
    <Dropdown>
      <DropdownTrigger>
        <AvatarButton src={user?.avatar_url} fallback={user?.name} className={className} />
      </DropdownTrigger>
      <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
        <DropdownMenuItem
          icon="moon"
          selected={darkMode}
          onClick={() => {
            setDarkMode(!darkMode);
          }}
        >
          Dark Mode
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          as="a"
          target="_blank"
          href="https://www.decapcms.org/community/"
          icon="help-circle"
        >
          Help
        </DropdownMenuItem>
        <DropdownMenuItem
          as="a"
          target="_blank"
          href="https://www.decapcms.org/docs/"
          icon="file-text"
        >
          Documentation
        </DropdownMenuItem>
        <DropdownMenuItem
          as="a"
          target="_blank"
          href="https://github.com/decaporg/decap-cms/issues"
          icon="alert-triangle"
        >
          Report an issue
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem icon="log-out" onClick={onLogoutClick}>
          Log out
        </DropdownMenuItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export default UserMenu;
