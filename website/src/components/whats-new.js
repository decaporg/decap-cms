import React from 'react';
import { css } from '@emotion/core';

import Container from './container';
import Release from './release';
import Grid from './grid';
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
      <Grid as="ol" cols={3}>
        {updates.slice(0, 3).map((item, idx) => (
          <Release {...item} versionPrevious={updates[idx + 1].version} key={item.version} />
        ))}
      </Grid>
    </Container>
  </section>
);

export default WhatsNew;
