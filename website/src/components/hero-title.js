import styled from '@emotion/styled';
import theme from '../theme';
import { mq } from '../utils';

const HeroTitle = styled.h1`
  color: ${theme.colors.green};
  font-size: ${theme.fontsize[6]};
  margin-bottom: ${theme.space[1]};

  ${mq[2]} {
    font-size: ${theme.fontsize[7]};
    margin-bottom: ${theme.space[2]};
  }
`;

export default HeroTitle;
