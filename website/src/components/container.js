import styled from '@emotion/styled';
import { css } from '@emotion/core';

import { mq } from '../utils';
import theme from '../theme';

const Container = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: 1280px;
  padding-left: ${theme.space[4]};
  padding-right: ${theme.space[4]};

  ${p =>
    p.size === 'sm' &&
    css`
      max-width: 800px;
    `};

  ${p =>
    p.size === 'md' &&
    css`
      max-width: 1024px;
    `};

  ${mq[3]} {
    padding-left: ${theme.space[5]};
    padding-right: ${theme.space[5]};
  }
`;

export default Container;
