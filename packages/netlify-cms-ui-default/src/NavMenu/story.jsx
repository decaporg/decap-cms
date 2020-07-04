import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import { NavMenu, NavMenuGroup, NavMenuGroupLabel, NavMenuItem } from '.';

export default {
  title: 'Components/NavMenu',
  decorators: [withKnobs],
};

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.color.background};
`;

export const _NavMenu = () => {
  const [activeItemId, setActiveItemId] = useState('dashboard');
  const showGroupLabels = boolean('Show group labels', false);
  const collapsable = boolean('collapsable', true);

  return (
    <Wrap>
      <NavMenu collapsable={collapsable}>
        <NavMenuGroup>
          {showGroupLabels && <NavMenuGroupLabel>Primary items</NavMenuGroupLabel>}
          <NavMenuItem
            active={activeItemId === 'dashboard'}
            onClick={() => setActiveItemId('dashboard')}
            icon="layout"
          >
            Dashboard
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'workflow'}
            onClick={() => setActiveItemId('workflow')}
            icon="workflow"
          >
            Workflow
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'media'}
            onClick={() => setActiveItemId('media')}
            icon="image"
          >
            Media
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'posts'}
            onClick={() => setActiveItemId('posts')}
            icon="pin"
          >
            Posts
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'post-categories'}
            onClick={() => setActiveItemId('post-categories')}
            icon="inbox"
          >
            Post Categories
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'pages'}
            onClick={() => setActiveItemId('pages')}
            icon="file-text"
          >
            Pages
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'products'}
            onClick={() => setActiveItemId('products')}
            icon="shopping-cart"
          >
            Products
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'product-categories'}
            onClick={() => setActiveItemId('product-categories')}
            icon="package"
          >
            Product Categories
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'authors'}
            onClick={() => setActiveItemId('authors')}
            icon="users"
          >
            Authors
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'events'}
            onClick={() => setActiveItemId('events')}
            icon="calendar"
          >
            Events
          </NavMenuItem>
        </NavMenuGroup>
        <NavMenuGroup end>
          {showGroupLabels && <NavMenuGroupLabel>Secondary Items</NavMenuGroupLabel>}
          <NavMenuItem href="https://app.netlify.com/my-website/analytics" icon="bar-chart">
            Analytics
          </NavMenuItem>
          <NavMenuItem href="https://app.netlify.com/my-website/" icon="server">
            Netlify
          </NavMenuItem>
          <NavMenuItem href="https://github.com/joebob/my-website" icon="github">
            Github Repository
          </NavMenuItem>
          <NavMenuItem
            active={activeItemId === 'settings'}
            onClick={() => setActiveItemId('settings')}
            icon="settings"
          >
            Settings
          </NavMenuItem>
        </NavMenuGroup>
      </NavMenu>
    </Wrap>
  );
};

_NavMenu.story = {
  name: 'NavMenu',
};
