import React from 'react';
import { css } from '@emotion/core';

import Page from './page';
import { mq } from '../utils';

const SidebarLayout = ({ sidebar, children }) => (
  <Page
    css={css`
      ${mq[1]} {
        display: grid;
        grid-template-columns: 300px 1fr;
        grid-gap: 2rem;
      }
    `}
  >
    <div>{sidebar}</div>
    <div>{children}</div>
  </Page>
);

export default SidebarLayout;
