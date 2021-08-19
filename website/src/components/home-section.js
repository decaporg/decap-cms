import React from 'react';
import styled from '@emotion/styled';

import Container from './container';
import Page from './page';
import theme from '../theme';

const Header = styled.header`
  text-align: center;
  padding-top: ${theme.space[7]};
  padding-bottom: ${theme.space[7]};
`;

const Title = styled.h2`
  font-size: ${theme.fontsize[6]};
`;

const Text = styled.div`
  max-width: 710px;
  margin: 0 auto;
`;

function HomeSection({ title, text, children, ...props }) {
  return (
    <Page as="section" {...props}>
      <Container>
        <Header>
          <Title>{title}</Title>
          {text && <Text>{text}</Text>}
        </Header>
        {children}
      </Container>
    </Page>
  );
}

export default HomeSection;
