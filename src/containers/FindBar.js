import React, { Component, PropTypes } from 'react';
import fuzzy from 'fuzzy';
import _ from 'lodash';
import { runCommand } from '../actions/findbar';
import { connect } from 'react-redux';
import styles from './FindBar.css';

class FindBar extends Component {
  constructor(props) {
    super(props);
    this._compiledCommands = {};
    this.state = {
      value: '',
      placeholder: '',
      activeScope: null,
      isOpen: false,
      highlightedIndex: 0,
    };

    this._getSuggestions = _.memoize(this._getSuggestions, (value, activeScope) => value + activeScope);

    this.compileCommand = this.compileCommand.bind(this);
    this.matchCommand = this.matchCommand.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);
    this.getSuggestions = this.getSuggestions.bind(this);
    this.highlightCommandFromMouse = this.highlightCommandFromMouse.bind(this);
    this.selectCommandFromMouse = this.selectCommandFromMouse.bind(this);
    this.setIgnoreBlur = this.setIgnoreBlur.bind(this);
    this.renderMenu = this.renderMenu.bind(this);
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

  compileCommand(command) {
    let regexp = '';
    let param;

    const matcher = /\(:([a-zA-Z_$][a-zA-Z0-9_$]*)(?:(?: as )(.*))?\)/g;
    const match = matcher.exec(command.pattern);
    const token = command.pattern.slice(0, match.index) || command.token;
    regexp += this._escapeRegExp(command.pattern.slice(0, match.index));

    if (match[1]) {
      regexp += '(.*)';
      param = { name:match[1], display:match[2] || this._camelCaseToSpace(match[1]) };
    }

    return Object.assign({}, command, {
      regexp,
      token,
      param
    });
  }

  matchCommand() {
    const string = this.state.activeScope ? this.state.activeScope + this.state.value : this.state.value;
    let match;
    const command = this._compiledCommands.find(command => {
      match = string.match(RegExp(`^${command.regexp}`, 'i'));
      return match;
    });

    const param = match[1] && match[1].trim();

    if (!command) {
      return null;
    } else if (command && !param) {
      this.setState({
        value: '',
        activeScope: command.token,
        placeholder: command.param.display
      });
    } else {
      this.props.dispatch(runCommand(command.token, command.param.name, param));
    }
  }

  handleChange(event) {
    this.setState({
      value: event.target.value,
    });
  }

  handleKeyDown(event) {
    let highlightedIndex, index;
    switch (event.key) {
      case 'Backspace':
        if (this.state.value.length === 0 && this.state.activeScope) {
          this.setState({
            activeScope: null,
            placeholder: ''
          });
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        highlightedIndex = this.state.highlightedIndex;
        index = (
          highlightedIndex === this.getSuggestions().length - 1 ||
          this.state.isOpen === false
        ) ?  0 : highlightedIndex + 1;
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
            highlightedIndex: 0
          };
          if (command) {
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
          highlightedIndex: 0,
          isOpen: false
        });
        break;
      default:
        this.setState({
          highlightedIndex: 0,
          isOpen: true
        });
    }
  }

  handleInputBlur() {
    if (this._ignoreBlur) return;
    this.setState({
      isOpen: false,
      highlightedIndex: 0
    });
  }

  handleInputFocus() {
    if (this._ignoreBlur) return;
    this.setState({ isOpen: true });
  }

  handleInputClick() {
    if (this.state.isOpen === false)
      this.setState({ isOpen: true });
  }

  _getSuggestions(value, scope, commands) {
    if (scope) return []; // TODO: Prepare for multiple params & search suggestions
    const results = fuzzy.filter(value, commands, {
      //pre: '<strong>',
      //post: '</strong>',
      extract: el => el.token
    });
    return results.slice(0, 5).map(result => result.original);
  }

  getSuggestions() {
    return this._getSuggestions(this.state.value, this.state.activeScope, this._compiledCommands);
  }

  highlightCommandFromMouse(index) {
    this.setState({ highlightedIndex: index });
  }

  selectCommandFromMouse(command) {
    this.setState({
      value: command.token,
      isOpen: false,
      highlightedIndex: 0
    }, () => {
      this.matchCommand();
      this._input.focus();
      this.setIgnoreBlur(false);
    });
  }

  setIgnoreBlur(ignore) {
    this._ignoreBlur = ignore;
  }

  renderMenu() {
    const commands = this.getSuggestions().map((command, index) => {
      return (
        <div
            className={this.state.highlightedIndex === index ? styles.highlightedCommand : styles.command}
            key={command.token.trim().replace(/[^a-z0-9]+/gi, '-')}
            onMouseDown={() => this.setIgnoreBlur(true)}
            onMouseEnter={() => this.highlightCommandFromMouse(index)}
            onClick={() => this.selectCommandFromMouse(command)}
            ref={`command-${index}`}
        >{command.token}</div>
      );
    });

    return commands.length > 0 ? <div className={styles.menu} children={commands} /> : null;
  }

  renderActiveScope() {
    return <div className={styles.inputScope}>{this.state.activeScope}</div>;
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
              ref={(c) => this._input = c}
              onFocus={this.handleInputFocus}
              onBlur={this.handleInputBlur}
              onChange={(event) => this.handleChange(event)}
              onKeyDown={(event) => this.handleKeyDown(event)}
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
FindBar.propTypes = {
  commands: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export { FindBar }
export default connect()(FindBar);
