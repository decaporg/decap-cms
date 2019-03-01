import React from 'react';
import { css } from '@emotion/core';

import Container from './container';

import theme from '../theme';
import { mq } from '../utils';

const PageHero = ({ children }) => (
  <section
    css={css`
      background: ${theme.colors.darkerGray};
      background-image: linear-gradient(to bottom, #2a2c24 0%, ${theme.colors.darkerGray} 20%);
      color: ${theme.colors.blueGray};
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

export default PageHero;
