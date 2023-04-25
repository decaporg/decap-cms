import React from 'react';
import { css } from '@emotion/core';

import Container from './container';
import theme from '../theme';
import { mq } from '../utils';

function PageHero({ children }) {
  return (
    <section
      css={css`
        color: ${theme.colors.gray};
        position: relative;
        padding-top: ${theme.space[6]};
        padding-bottom: ${theme.space[6]};

        ${mq[3]} {
          padding-top: ${theme.space[6]};
          padding-bottom: ${theme.space[8]};
        }
      `}
    >
      <Container>{children}</Container>
    </section>
  );
}

export default PageHero;
