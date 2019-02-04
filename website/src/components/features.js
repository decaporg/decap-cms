import React from 'react';
import styled from '@emotion/styled';

import Markdownify from './markdownify';
import theme from '../theme';

const Box = styled.div`
  margin-bottom: ${theme.space[5]};

  img {
    margin-bottom: ${theme.space[3]};
  }
`;

const Title = styled.h3`
  color: ${p => (p.kind === 'light' ? theme.colors.white : theme.colors.gray)};
`;

const Text = styled.p`
  a {
    font-weight: 700;
  }
`;

const FeatureItem = ({ feature, description, imgpath, kind }) => (
  <Box>
    {imgpath && <img src={require(`../img/${imgpath}`)} />}
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
