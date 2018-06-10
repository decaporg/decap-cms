import React, { Component } from 'react';
import Link from 'gatsby-link';
import classnames from 'classnames';
import Headroom from 'react-headroom';

import DocSearch from './docsearch';

import logo from '../img/netlify-cms-logo.svg';

import '../css/imports/header.css';

const Header = ({ location, notifications }) => {
  const isDocs = location.pathname.indexOf('docs') !== -1;
  const isBlog = location.pathname.indexOf('blog') !== -1;

  return (
    <Headroom disableInlineStyles>
      {notifications.map((node, i) => (
        <a
          key={i}
          href={node.url}
          className={classnames('notification', {
            'notification-loud': node.loud
          })}
        >
          {node.message}
        </a>
      ))}
      <header
        id="header"
        className={classnames({
          docs: isDocs || isBlog
        })}
      >
        <div className="contained">
          <div className="logo-container">
            <Link to="/" className="logo">
              <img src={logo} />
            </Link>
            {isDocs && <DocSearch />}
          </div>
          <div className="nav-container">
            <Link className="nav-link docs-link" to="/docs/intro">
              Docs
            </Link>
            <Link
              className="nav-link contributing-link"
              to="/docs/contributor-guide"
            >
              Contributing
            </Link>
            <Link className="nav-link" to="/community">
              Community
            </Link>
            <Link className="nav-link" to="/blog">
              Blog
            </Link>
            <a
              id="ghstars"
              className="github-button"
              href="https://github.com/netlify/netlify-cms"
              data-icon="octicon-star"
              data-show-count="true"
              aria-label="Star netlify/netlify-cms on GitHub"
            >
              Star
            </a>
          </div>
        </div>
      </header>
    </Headroom>
  );
};

export default Header;
