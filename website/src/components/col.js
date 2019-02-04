import styled from '@emotion/styled';
import theme from '../theme';
import { mq } from '../utils';

const Col = styled.div`
  flex: 1;
  padding-left: ${theme.space[3] / 2};
  padding-right: ${theme.space[3] / 2};
`;

export default Col;
