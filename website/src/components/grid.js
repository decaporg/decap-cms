import styled from '@emotion/styled';

import { mq } from '../utils';
import theme from '../theme';

const Grid = styled.div`
  ${mq[2]} {
    display: grid;
    grid-template-columns: repeat(${p => p.cols}, 1fr);
    grid-gap: ${theme.space[7]};
  }
`;

export default Grid;
