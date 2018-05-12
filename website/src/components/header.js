import React from 'react';
import Link from 'gatsby-link';
import classnames from 'classnames';

import DocSearch from './docsearch';

import logo from '../img/netlify-cms-logo.svg';

const Header = ({ location }) => {
  const isDocs = location.pathname.includes('docs');

  return (
    <header
      id="header"
      className={classnames({
        docs: isDocs
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
  );
};

export default Header;
