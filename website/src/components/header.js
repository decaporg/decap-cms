import React, { Component } from 'react';
import Link from 'gatsby-link';
import classnames from 'classnames';
import { Location } from '@reach/router';

import DocSearch from './docsearch';
import GitHubButton from './github-button';

import logo from '../img/netlify-cms-logo.svg';

import '../css/imports/header.css';

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

          return (
            <header
              id="header"
              className={classnames({
                docs: isDocs,
                blog: isBlog,
                scrolled,
              })}
            >
              <div className="contained">
                <div className="logo-container">
                  <Link to="/" className="logo">
                    <img src={logo} alt="Netlify CMS" />
                  </Link>
                  <DocSearch />
                </div>
                <div className="nav-container">
                  <span className="gh-button">
                    <GitHubButton />
                  </span>
                  <Link className="nav-link docs-link" to="/docs/intro/">
                    Docs
                  </Link>
                  <Link className="nav-link contributing-link" to="/docs/contributor-guide/">
                    Contributing
                  </Link>
                  <Link className="nav-link" to="/community/">
                    Community
                  </Link>
                  <Link className="nav-link" to="/blog/">
                    Blog
                  </Link>
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
