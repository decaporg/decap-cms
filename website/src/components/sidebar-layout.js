import React from 'react';
import { css } from '@emotion/core';

import Page from './page';
import { mq } from '../utils';
import styled from '@emotion/styled';

const Children = styled.div`
  overflow: auto;
  padding-left: 2rem;
`;

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
    <Children>{children}</Children>
  </Page>
);

export default SidebarLayout;
