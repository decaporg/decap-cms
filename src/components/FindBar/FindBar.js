import PropTypes from 'prop-types';
import React, { Component } from 'react';


export const SEARCH = 'SEARCH';
const PLACEHOLDER = 'Search entry titles...';

class FindBar extends Component {
  static propTypes = {
    runCommand: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this._searchCommand = {
      regexp: `(?:${ SEARCH })?(.*)`,
      param: { name: 'searchTerm', display: '' },
    };
    this.state = {
      value: '',
      placeholder: PLACEHOLDER,
    };
  }

  search = () => {
    const string = this.state.value;
    const command = this._searchCommand;
    const match = string.match(RegExp(`^${ this._searchCommand.regexp }`, 'i'));
    const enteredParamValue = command && command.param && match[1] ? match[1].trim() : null;

    if (enteredParamValue) {
      this.props.runCommand(SEARCH, { searchTerm: enteredParamValue });
    }
  };

  handleKeyDown = event => (event.key === 'Enter' && this.search());
  handleChange = event => this.setState({ value: event.target.value });

  render() {
    return (
      <div className="nc-findBar-root">
        <label htmlFor="searchInput" />
        <input
          id="searchInput"
          className="nc-findBar-inputField"
          ref={c => this._input = c} // eslint-disable-line no-return-assign
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          placeholder={this.state.placeholder}
          value={this.state.value}
        />
      </div>
    );
  }
}

export default FindBar;
