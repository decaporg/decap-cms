import React from 'react';
import { css } from '@emotion/core';

import Page from './page';
import { mq } from '../utils';
import styled from '@emotion/styled';

const Children = styled.div`
  overflow: auto;
  padding-left: 2rem;
`;

function SidebarLayout({ sidebar, children }) {
  return (
    <Page
      css={css`
        ${mq[1]} {
          display: grid;
          grid-template-columns: ${sidebar ? '300px' : ''} minmax(0, 1fr);
          grid-gap: 2rem;
        }
      `}
    >
      {sidebar && <div>{sidebar}</div>}
      <Children>{children}</Children>
    </Page>
  );
}

export default SidebarLayout;
