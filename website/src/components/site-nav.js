import React from 'react';
import { Link } from 'gatsby';

const SiteNav = () => (
  <nav>
    <Link className="site-nav-link" to="/docs/intro">
      Docs
    </Link>
    <Link className="site-nav-link" to="/docs/contributor-guide">
      Contributing
    </Link>
    <Link className="site-nav-link" to="/community">
      Community
    </Link>
    <Link className="site-nav-link" to="/blog">
      Blog
    </Link>
    <span className="gh-button">
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
    </span>
  </nav>
);

export default SiteNav;
