import React from 'react';
import styled from '@emotion/styled';

import Markdownify from './markdownify';
import theme from '../theme';

const Box = styled.div`
  margin-bottom: ${theme.space[5]};

  img {
    margin-bottom: ${theme.space[3]};
    margin-left: -${theme.space[2]};
  }
`;

const Title = styled.h3`
  color: ${p => (p.kind === 'light' ? theme.colors.white : theme.colors.gray)};
  font-size: ${theme.fontsize[4]};
`;

const Text = styled.p`
  font-size: 18px;
  a {
    font-weight: 700;
  }
`;

const FeatureItem = ({ feature, description, imgpath, kind }) => (
  <Box>
    {imgpath && <img src={require(`../img/${imgpath}`)} alt="" />}
    <Title kind={kind}>
      <Markdownify source={feature} />
    </Title>
    <Text>
      <Markdownify source={description} />
    </Text>
  </Box>
);

const Features = ({ items, kind }) =>
  items.map(item => <FeatureItem kind={kind} {...item} key={item.feature} />);

export default Features;
