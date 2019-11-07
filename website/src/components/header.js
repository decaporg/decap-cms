import React, { useState, useEffect } from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import GitHubButton from 'react-github-btn';
import Container from './container';
import Notifications from './notifications';
import DocSearch from './docsearch';

import logo from '../img/netlify-cms-logo.svg';
import searchIcon from '../img/search.svg';

import theme from '../theme';
import { mq } from '../utils';

const StyledHeader = styled.header`
  background: ${theme.colors.darkerGray};
  padding-top: ${theme.space[3]};
  padding-bottom: ${theme.space[3]};
  transition: background 0.2s ease, padding 0.2s ease, box-shadow 0.2s ease;

  ${mq[2]} {
    position: sticky;
    top: 0;
    width: 100%;
    z-index: ${theme.zIndexes.header};

    ${p =>
      p.hasHeroBelow &&
      !p.scrolled &&
      css`
        background: #2a2c24;
        padding-top: ${theme.space[5]};
        padding-bottom: ${theme.space[5]};
      `};
  }
`;

const HeaderContainer = styled(Container)`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;

const Logo = styled.div`
  flex: 1 0 50%;
  ${mq[1]} {
    flex: 0 0 auto;
    margin-right: ${theme.space[5]};
  }
`;

const MenuActions = styled.div`
  flex: 1 0 50%;
  display: flex;
  justify-content: flex-end;
  ${mq[1]} {
    display: none;
  }
`;

const MenuBtn = styled.button`
  background: none;
  border: 0;
  color: white;
  padding: ${theme.space[3]};
  font-size: ${theme.fontsize[4]};
  line-height: 1;
`;

const SearchBtn = styled(MenuBtn)``;

const ToggleArea = styled.div`
  display: ${p => (p.open ? 'block' : 'none')};
  flex: 1;
  width: 100%;
  margin-top: ${theme.space[3]};

  ${mq[1]} {
    display: block;
    width: auto;
    margin-top: 0;
  }
`;

const SearchBox = styled(ToggleArea)`
  ${mq[1]} {
    flex: 1;
    max-width: 200px;
    margin-right: ${theme.space[3]};
  }
`;

const Menu = styled(ToggleArea)`
  ${mq[1]} {
    flex: 0 0 auto;
    margin-left: auto;
  }
`;

const MenuList = styled.ul`
  ${mq[1]} {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }
`;

const MenuItem = styled.li`
  margin-bottom: ${theme.space[3]};
  ${mq[1]} {
    margin-bottom: 0;

    &:not(:last-child) {
      margin-right: ${theme.space[3]};
    }
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 600;
`;

const Header = ({ hasHeroBelow }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    // TODO: use raf to throttle events
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScroll = () => {
    const currentWindowPos = document.documentElement.scrollTop || document.body.scrollTop;

    const scrolled = currentWindowPos > 0;

    setScrolled(scrolled);
  };

  const handleMenuBtnClick = () => {
    setNavOpen(s => !s);
    setSearchOpen(false);
  };

  const handleSearchBtnClick = () => {
    setSearchOpen(s => !s);
    setNavOpen(false);
  };

  return (
    <StyledHeader scrolled={scrolled} id="header" hasHeroBelow={hasHeroBelow}>
      <Notifications />
      <HeaderContainer>
        <Logo>
          <Link to="/">
            <img src={logo} alt="Netlify CMS logo" />
          </Link>
        </Logo>
        <MenuActions>
          <SearchBtn onClick={handleSearchBtnClick}>
            {isSearchOpen ? <span>&times;</span> : <img src={searchIcon} alt="search" />}
          </SearchBtn>
          <MenuBtn onClick={handleMenuBtnClick}>
            {isNavOpen ? <span>&times;</span> : <span>&#9776;</span>}
          </MenuBtn>
        </MenuActions>
        <SearchBox open={isSearchOpen}>
          <DocSearch />
        </SearchBox>
        <Menu open={isNavOpen}>
          <MenuList>
            <MenuItem
              css={css`
                margin-top: 8px;
              `}
            >
              <GitHubButton
                href="https://github.com/netlify/netlify-cms"
                data-icon="octicon-star"
                data-show-count="true"
                aria-label="Star netlify/netlify-cms on GitHub"
              >
                Star
              </GitHubButton>
            </MenuItem>
            <MenuItem>
              <NavLink to="/docs/intro/">Docs</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/docs/contributor-guide/">Contributing</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/community/">Community</NavLink>
            </MenuItem>
            <MenuItem>
              <NavLink to="/blog/">Blog</NavLink>
            </MenuItem>
          </MenuList>
        </Menu>
      </HeaderContainer>
    </StyledHeader>
  );
};

export default Header;
