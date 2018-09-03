import React, { Component, Fragment } from 'react';
import Link from 'gatsby-link';
import classnames from 'classnames';
import { Location } from '@reach/router';

import DocSearch from './docsearch';
import Notifications from './notifications';
import SiteNav from './site-nav';

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

          return (
            <header
              id="header"
              className={classnames('site-header', {
                docs: isDocs,
                blog: isBlog,
                scrolled,
              })}
            >
              <Notifications />
              <div className="header-inner contained">
                <div className="site-logo">
                  <Link to="/" className="site-logo-link">
                    <img src={logo} />
                  </Link>
                </div>
                <DocSearch />
                <div className="site-nav">
                  <SiteNav />
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
