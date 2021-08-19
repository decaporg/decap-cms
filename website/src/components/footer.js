import React from 'react';
import styled from '@emotion/styled';

import Container from './container';
import theme from '../theme';
import { mq } from '../utils';

const Root = styled.footer`
  background: white;
  padding-top: ${theme.space[4]};
  padding-bottom: ${theme.space[5]};
`;

const FooterGrid = styled.div`
  text-align: center;

  ${mq[2]} {
    display: flex;
    align-items: center;
    text-align: left;
  }
`;

const FooterButtons = styled.div`
  margin-bottom: ${theme.space[3]};
  ${mq[2]} {
    margin-bottom: 0;
  }
`;

const SocialButton = styled.a`
  display: inline-block;
  padding: ${theme.space[1]} ${theme.space[3]};
  background-color: ${theme.colors.lightishGray};
  color: white;
  font-weight: 700;
  font-size: ${theme.fontsize[2]};
  border-radius: ${theme.radii[1]};
  margin-right: ${theme.space[2]};

  &:active,
  &:hover {
    background-color: ${theme.colors.darkGreen};
  }
`;

const Info = styled.div`
  font-size: ${theme.fontsize[1]};
  color: ${theme.colors.gray};
  opacity: 0.5;

  ${mq[2]} {
    padding-left: ${theme.space[4]};
  }

  a {
    font-weight: 700;
    color: ${theme.colors.gray};
  }
`;

function Footer({ buttons }) {
  return (
    <Root>
      <Container>
        <FooterGrid>
          <FooterButtons>
            {buttons.map(btn => (
              <SocialButton href={btn.url} key={btn.url}>
                {btn.name}
              </SocialButton>
            ))}
          </FooterButtons>
          <Info>
            <p>
              <a
                href="https://github.com/netlify/netlify-cms/blob/master/LICENSE"
                className="text-link"
              >
                Distributed under MIT License
              </a>{' '}
              ·{' '}
              <a
                href="https://github.com/netlify/netlify-cms/blob/master/CODE_OF_CONDUCT.md"
                className="text-link"
              >
                Code of Conduct
              </a>
            </p>
          </Info>
        </FooterGrid>
      </Container>
    </Root>
  );
}

export default Footer;
