import React from 'react';
import { css } from '@emotion/core';

import { mq } from '../utils';
import theme from '../theme';

const SidebarLayout = ({ sidebar, children }) => (
  <div
    css={css`
      padding-top: ${theme.space[3]};
      padding-bottom: ${theme.space[3]};

      ${mq[1]} {
        padding-top: ${theme.space[5]};
        padding-bottom: ${theme.space[5]};
        display: grid;
        grid-template-columns: 200px 1fr;
        grid-gap: 2rem;
      }
    `}
  >
    <div>{sidebar}</div>
    <div>{children}</div>
  </div>
);

export default SidebarLayout;
