import React, { Component } from 'react';
import { Link } from 'gatsby';
import { Location } from '@reach/router';
import styled from '@emotion/styled';

import DocSearch from './docsearch';
import GitHubButton from './github-button';
import Container from './container';
import Notifications from './notifications';

import logo from '../img/netlify-cms-logo.svg';

import theme from '../theme';
import { mq } from '../utils';

const Root = styled.header`
  background: ${theme.colors.darkerGray};
  transition: background 0.2s ease, padding 0.2s ease, box-shadow 0.2s ease;

  ${mq[3]} {
    position: sticky;
    top: 0;
    width: 100%;
    z-index: ${theme.zIndexes.header};
  }
`;

const HeaderContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: ${theme.space[3]};
  padding-bottom: ${theme.space[3]};

  ${mq[2]} {
    flex-direction: row;
  }
`;

const Logo = styled.div`
  flex: 1;
  margin-bottom: ${theme.space[3]};

  ${mq[2]} {
    margin-bottom: 0;
  }
`;

const Menu = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
`;

const MenuItem = styled.div`
  margin-right: ${theme.space[3]};
  margin-bottom: ${theme.space[3]};

  ${mq[2]} {
    margin-bottom: 0;
  }

  .nav-link {
    color: white;
    text-decoration: none;
    font-weight: 500;
  }
`;

class Header extends Component {
  state = {
    scrolled: false,
  };

  async componentDidMount() {
    // TODO: use raf to throttle events
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const currentWindowPos = document.documentElement.scrollTop || document.body.scrollTop;

    const scrolled = currentWindowPos > 0;

    this.setState({
      scrolled,
    });
  };

  render() {
    const { scrolled } = this.state;

    return (
      <Location>
        {({ location }) => {
          const isDocs = location.pathname.indexOf('docs') !== -1;
          const isBlog = location.pathname.indexOf('blog') !== -1;

          // #header id for smooth scroll
          return (
            <Root scrolled={scrolled} id="header">
              <Notifications />
              <HeaderContainer>
                <Logo>
                  <Link to="/" className="logo">
                    <img src={logo} alt="Netlify CMS" />
                  </Link>
                </Logo>
                <Menu>
                  <MenuItem>
                    <Link className="nav-link" to="/docs/intro">
                      Docs
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link className="nav-link" to="/docs/contributor-guide">
                      Contributing
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link className="nav-link" to="/community">
                      Community
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link className="nav-link" to="/blog">
                      Blog
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <GitHubButton />
                  </MenuItem>
                </Menu>
              </HeaderContainer>
            </Root>
          );
        }}
      </Location>
    );
  }
}

export default Header;
