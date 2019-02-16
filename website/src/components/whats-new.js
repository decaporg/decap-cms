import React from 'react';
import { css } from '@emotion/core';

import Container from './container';
import Release from './release';
import { mq } from '../utils';
import theme from '../theme';

const WhatsNew = ({ updates }) => (
  <section
    css={css`
      background: ${theme.colors.lightishGray};
      padding-top: ${theme.space[6]};
      padding-bottom: ${theme.space[5]};
    `}
  >
    <Container>
      <ol
        css={css`
          ${mq[2]} {
            display: flex;
            justify-content: space-between;
          }
        `}
      >
        {updates.splice(0, 3).map((item, idx) => (
          <Release {...item} versionPrevious={updates[idx + 1].version} key={item.version} />
        ))}
      </ol>
    </Container>
  </section>
);

export default WhatsNew;
