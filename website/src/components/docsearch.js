import React, { Component } from 'react';

import searchIcon from '../img/search.svg';

class DocSearch extends Component {
  state = {
    enabled: true,
  };
  componentDidMount() {
    if (window.docsearch) {
      window.docsearch({
        apiKey: '08d03dc80862e84c70c5a1e769b13019',
        indexName: 'netlifycms',
        inputSelector: '.algolia-search',
        debug: false, // Set debug to true if you want to inspect the dropdown
      });
    } else {
      this.setState({ enabled: false });
    }
  }
  render() {
    if (!this.state.enabled) {
      return null;
    }

    return (
      <a className="utility-input">
        <img src={searchIcon} />
        <input type="search" placeholder="Search the docs" className="algolia-search" />
      </a>
    );
  }
}

export default DocSearch;
