import React, { Component } from 'react';
import Link from 'gatsby-link';
import classnames from 'classnames';
import { Location } from '@reach/router';

import DocSearch from './docsearch';

import logo from '../img/netlify-cms-logo.svg';

import '../css/imports/header.css';

class Header extends Component {
  state = {
    scrolled: false,
  };

  componentDidMount() {
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
          const isRoadmap = location.pathname.indexOf('roadmap') !== -1;

          return (
            <header
              id="header"
              className={classnames({
                docs: isDocs,
                blog: isBlog,
                roadmap: isRoadmap,
                scrolled,
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
                  <Link className="nav-link contributing-link" to="/docs/contributor-guide">
                    Contributing
                  </Link>
                  <Link className="nav-link" to="/community">
                    Community
                  </Link>
                  <Link className="nav-link" to="/roadmap">
                    Roadmap
                  </Link>
                  <Link className="nav-link" to="/blog">
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
                </div>
              </div>
            </header>
          );
        }}
      </Location>
    );
  }
}

export default Header;
