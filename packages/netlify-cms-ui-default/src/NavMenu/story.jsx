import React, { useState } from 'react';
import styled from '@emotion/styled';
import { withKnobs, object } from '@storybook/addon-knobs';

import NavMenu from '.';

export default {
  title: 'Components/NavMenu',
  decorators: [withKnobs],
};

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.color.background};
`;

const sections = [
  {
    items: [
      { id: 'posts', icon: 'edit-3', label: 'Posts' },
      { id: 'post-categories', icon: 'inbox', label: 'Post Cotegories' },
      { id: 'pages', icon: 'file-text', label: 'Pages' },
      { id: 'products', icon: 'shopping-cart', label: 'Products' },
      { id: 'product-categories', icon: 'package', label: 'Products Categories' },
      { id: 'authors', icon: 'users', label: 'Authors' },
      { id: 'events', icon: 'calendar', label: 'Events' },
    ],
  },
  {
    items: [
      { id: 'media', icon: 'image', label: 'Media' },
      { id: 'workflow', icon: 'workflow', label: 'Workflow' },
    ],
  },
  {
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        href: 'https://app.netlify.com/my-website/analytics',
        icon: 'bar-chart',
      },
      {
        id: 'netlify',
        label: 'Netlify',
        href: 'https://app.netlify.com/sites/my-website',
        icon: 'server',
      },
      {
        id: 'github-repo',
        label: 'Github Repository',
        href: 'https://github.com/joebob/my-website',
        icon: 'github',
      },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export const _NavMenu = () => {
  const [activeItemId, setActiveItemId] = useState('posts');
  return (
    <Wrap>
      <NavMenu
        activeItem={activeItemId}
        sections={object('Sections', sections)}
        onItemClick={item => setActiveItemId(item.id)}
      />
    </Wrap>
  );
};

_NavMenu.story = {
  name: 'NavMenu',
};
