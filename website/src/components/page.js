import styled from '@emotion/styled';

import theme from '../theme';
import { mq } from '../utils';

const Page = styled.div`
  padding-top: ${theme.space[5]};
  padding-bottom: ${theme.space[5]};

  ${mq[1]} {
    padding-top: ${theme.space[6]};
    padding-bottom: ${theme.space[6]};
  }
`;

export default Page;
