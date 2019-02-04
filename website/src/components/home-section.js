import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import Container from './container';
import theme from '../theme';
import { mq } from '../utils';

const Section = styled.section`
  padding-top: ${theme.space[7]};
  padding-bottom: ${theme.space[7]};
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: ${theme.space[6]};
`;

const Title = styled.h2`
  font-size: ${theme.fontsize[6]};
`;

const Text = styled.div`
  max-width: 710px;
  margin: 0 auto;
`;

const HomeSection = ({ title, text, children, css }) => (
  <Section css={css}>
    <Container>
      <Header>
        <Title>{title}</Title>
        {text && <Text>{text}</Text>}
      </Header>
      {children}
    </Container>
  </Section>
);

export default HomeSection;
