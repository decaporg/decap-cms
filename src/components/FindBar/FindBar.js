import React, { Component, PropTypes } from 'react';
import fuzzy from 'fuzzy';
import _ from 'lodash';
import { Icon } from '../UI';
import styles from './FindBar.css';

export const SEARCH = 'SEARCH';
const PLACEHOLDER = 'Search or enter a command';

class FindBar extends Component {
  static propTypes = {
    commands: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      pattern: PropTypes.string.isRequired,
    })).isRequired,
    defaultCommands: PropTypes.arrayOf(PropTypes.string),
    runCommand: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this._compiledCommands = [];
    this._searchCommand = {
      search: true,
      regexp: `(?:${ SEARCH })?(.*)`,
      param: { name: 'searchTerm', display: '' },
      token: SEARCH,
    };
    this.state = {
      value: '',
      placeholder: PLACEHOLDER,
      activeScope: null,
      isOpen: false,
      highlightedIndex: 0,
    };

    this._getSuggestions = _.memoize(this._getSuggestions, (value, activeScope) => value + activeScope);
  }

  componentWillMount() {
    this._ignoreBlur = false;
  }

  componentDidMount() {
    this._compiledCommands = this.props.commands.map(this.compileCommand);
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _camelCaseToSpace(string) {
    const result = string.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Generates a regexp and splits a token and param details for a command
  compileCommand = (command) => {
    let regexp = '';
    let param = null;

    const matcher = /\(:([a-zA-Z_$][a-zA-Z0-9_$]*)(?:(?: as )(.*))?\)/g;
    const match = matcher.exec(command.pattern);
    const matchIndex = match ? match.index : command.pattern.length;

    const token = command.pattern.slice(0, matchIndex) || command.token;
    regexp += this._escapeRegExp(command.pattern.slice(0, matchIndex));

    if (match && match[1]) {
      regexp += '(.*)';
      param = { name: match[1], display: match[2] || this._camelCaseToSpace(match[1]) };
    }

    return Object.assign({}, command, {
      regexp,
      token,
      param,
    });
  };

  // Check if the entered string matches any command.
  // adds a scope (so user can type param value) and dispatches action for fully matched commands
  matchCommand = () => {
    const string = this.state.activeScope ? this.state.activeScope + this.state.value : this.state.value;
    let match;
    let command = this._compiledCommands.find((command) => {
      match = string.match(RegExp(`^${ command.regexp }`, 'i'));
      return match;
    });

    // If no command was found, trigger a search command
    if (!command) {
      command = this._searchCommand;
      match = string.match(RegExp(`^${ this._searchCommand.regexp }`, 'i'));
    }

    const paramName = command && command.param ? command.param.name : null;
    const enteredParamValue = command && command.param && match[1] ? match[1].trim() : null;

    if (command.search) {
      this.setState({
        value: '',
        placeholder: PLACEHOLDER,
        activeScope: null,
      }, () => {
        this._input.blur();
      });

      enteredParamValue && this.props.runCommand(SEARCH, { searchTerm: enteredParamValue });
    } else if (command.param && !enteredParamValue) {
      // Partial Match
      // Command was partially matched: It requires a param, but param wasn't entered
      // Set a scope so user can fill the param
      this.setState({
        value: '',
        activeScope: command.token,
        placeholder: command.param.display,
      });
    } else {
      // Match
      // Command was matched and either it doesn't require a param or it's required param was entered
      // Dispatch action
      this.setState({
        value: '',
        placeholder: PLACEHOLDER,
        activeScope: null,
      }, () => {
        this._input.blur();
      });
      const payload = command.payload || {};
      if (paramName) {
        payload[paramName] = enteredParamValue;
      }
      this.props.runCommand(command.type, payload);
    }
  };

  maybeRemoveActiveScope = () => {
    if (this.state.value.length === 0 && this.state.activeScope) {
      this.setState({
        activeScope: null,
        placeholder: PLACEHOLDER,
      });
    }
  };

  getSuggestions = () => {
    return this._getSuggestions(this.state.value, this.state.activeScope, this._compiledCommands, this.props.defaultCommands);
  };

  // Memoized version
  _getSuggestions(value, scope, commands, defaultCommands) {
    if (scope) return []; // No autocomplete for scoped input
    if (value.length === 0 && defaultCommands) {
      return commands
        .filter(command => defaultCommands.indexOf(command.id) !== -1)
        .map(result => (
          Object.assign({}, result, { string: result.token }
          )));
    }

    const results = fuzzy.filter(value, commands, {
      pre: '<strong>',
      post: '</strong>',
      extract: el => el.token,
    });

    const returnResults = results.slice(0, 4).map(result => (
      Object.assign({}, result.original, { string: result.string }
      )));
    returnResults.push(this._searchCommand);

    return returnResults;
  }

  handleKeyDown = (event) => {
    let highlightedIndex,
      index;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        highlightedIndex = this.state.highlightedIndex;
        index = (
          highlightedIndex === this.getSuggestions().length - 1 ||
          this.state.isOpen === false
        ) ? 0 : highlightedIndex + 1;
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        highlightedIndex = this.state.highlightedIndex;
        index = (
          highlightedIndex === 0
        ) ? this.getSuggestions().length - 1 : highlightedIndex - 1;
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
        break;
      case 'Enter':
        if (this.state.isOpen) {
          const command = this.getSuggestions()[this.state.highlightedIndex];
          const newState = {
            isOpen: false,
            highlightedIndex: 0,
          };
          if (command && !command.search) {
            newState.value = command.token;
          }
          this.setState(newState, () => {
            this._input.focus();
            this._input.setSelectionRange(
              this.state.value.length,
              this.state.value.length
            );
            this.matchCommand();
          });
        }
        break;
      case 'Escape':
        this.setState({
          value: '',
          highlightedIndex: 0,
          isOpen: false,
          activeScope: null,
          placeholder: PLACEHOLDER,
        });
        break;
      case 'Backspace':
        this.setState({
          highlightedIndex: 0,
          isOpen: true,
        }, this.maybeRemoveActiveScope);
        break;
      default:
        this.setState({
          highlightedIndex: 0,
          isOpen: true,
        });
    }
  };

  handleChange = (event) => {
    this.setState({
      value: event.target.value,
    });
  };

  handleInputBlur = () => {
    if (this._ignoreBlur) return;
    this.setState({
      isOpen: false,
      highlightedIndex: 0,
    });
  };

  handleInputFocus = () => {
    if (this._ignoreBlur) return;
    this.setState({ isOpen: true });
  };

  handleInputClick = () => {
    if (this.state.isOpen === false)
      { this.setState({ isOpen: true }); }
  };

  highlightCommandFromMouse = (index) => {
    this.setState({ highlightedIndex: index });
  };

  selectCommandFromMouse = (command) => {
    const newState = {
      isOpen: false,
      highlightedIndex: 0,
    };
    if (command && !command.search) {
      newState.value = command.token;
    }
    this.setState(newState, () => {
      this.matchCommand();
      this._input.focus();
      this.setIgnoreBlur(false);
    });
  };

  setIgnoreBlur = (ignore) => {
    this._ignoreBlur = ignore;
  };

  renderMenu() {
    const commands = this.getSuggestions().map((command, index) => {
      let children;
      if (!command.search) {
        children = (
          <span><span dangerouslySetInnerHTML={{ __html: command.string }} /></span>
        );
      } else {
        children = (
          <span>
            {this.state.value.length === 0 ?
              <span><Icon type="search" />Search... </span> :
                <span className={styles.faded}><Icon type="search" />Search for: </span>
          }
            <strong>{this.state.value}</strong>
          </span>
        );
      }
      return (
        <div
          className={this.state.highlightedIndex === index ? styles.highlightedCommand : styles.command}
          key={command.token.trim().replace(/[^a-z0-9]+/gi, '-')}
          onMouseDown={() => this.setIgnoreBlur(true)}
          onMouseEnter={() => this.highlightCommandFromMouse(index)}
          onClick={() => this.selectCommandFromMouse(command)}
        >
          {children}
        </div>
      );
    });
    return commands.length === 0 ? null : (
      <div className={styles.menu}>
        <div className={styles.suggestions}>
          {commands}
        </div>
      </div>
    );
  }

  renderActiveScope() {
    if (this.state.activeScope === SEARCH) {
      return <div className={styles.inputScope}><Icon type="search" /></div>;
    } else {
      return <div className={styles.inputScope}>{this.state.activeScope}</div>;
    }
  }

  render() {
    const menu = this.state.isOpen && this.renderMenu();
    const scope = this.state.activeScope && this.renderActiveScope();
    return (
      <div className={styles.root}>
        <label className={styles.inputArea}>
          {scope}
          <input
            className={styles.inputField}
            ref={c => this._input = c}
            onFocus={this.handleInputFocus}
            onBlur={this.handleInputBlur}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            onClick={this.handleInputClick}
            placeholder={this.state.placeholder}
            value={this.state.value}
          />
        </label>
        {menu}
      </div>
    );
  }
}

export default FindBar;
