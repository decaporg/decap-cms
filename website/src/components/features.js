import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import Markdownify from './markdownify';
import Button from './button';
import theme from '../theme';

const Box = styled.div`
  margin-bottom: ${theme.space[5]};

  img {
    margin-bottom: ${theme.space[3]};
    margin-left: -${theme.space[2]};
  }
`;

const Title = styled.h3`
  color: ${p => (p.kind === 'light' ? theme.colors.primaryLight : theme.colors.primaryLight)};
  font-size: ${theme.fontsize[4]};
`;

const Text = styled.p`
  font-size: 18px;
  a {
    font-weight: 700;
  }
`;

function FeatureItem({ feature, description, imgpath, kind, cta }) {
  return (
    <Box>
      {imgpath && <img src={require(`../img/${imgpath}`).default} alt="" />}
      <Title kind={kind}>
        <Markdownify source={feature} />
      </Title>
      <Text>
        <Markdownify source={description} />
        <br/>
      </Text>
      {cta && <Button
        key={cta.label}
        href={cta.href}
        css={css`
          margin-top: ${theme.space[3]};
        `}
      >{cta.label}</Button>}
    </Box>
  );
}

function Features({ items, kind }) {
  return items.map(item => <FeatureItem kind={kind} {...item} key={item.feature} />);
}

export default Features;
