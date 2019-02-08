import styled from '@emotion/styled';

import { mq } from '../utils';

const Grid = styled.div`
  ${mq[2]} {
    display: grid;
    grid-template-columns: repeat(${p => p.cols}, 1fr);
    grid-gap: 2rem;
  }
`;

export default Grid;
