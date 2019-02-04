import styled from '@emotion/styled';

import { mq } from '../utils';
import theme from '../theme';

const Container = styled.div`
  margin-left: auto;
  margin-right: auto;
  max-width: 1200px;
  padding-left: ${theme.space[4]};
  padding-right: ${theme.space[4]};

  ${mq[3]} {
    padding-left: ${theme.space[5]};
    padding-right: ${theme.space[5]};
  }
`;

export default Container;
