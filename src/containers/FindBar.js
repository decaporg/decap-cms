import React, { Component, PropTypes } from 'react';
import fuzzy from 'fuzzy';
import _ from 'lodash';
import { connect } from 'react-redux';
import styles from './FindBar.css';

class FindBar extends Component {
  constructor(props) {
    super(props);
    this._compiledCommands = {};
    this.state = {
      value: this.props.initialValue,
      isOpen: false,
      highlightedIndex: 0,
    };

    this.compileCommand = this.compileCommand.bind(this);
    this.matchCommand = this.matchCommand.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);
    this.getSuggestions = _.memoize(this.getSuggestions);
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
    const token = command.pattern.slice(0, match.index);
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

  matchCommand(string) {
    let match;
    const command = this.compiledCommands.find(command => {
      match = string.match(RegExp(`^${command.regexp}`, 'i'));
      return match;
    });

    if (command === null) return null;

    return {
      command,
      param: match[1] && match[1].trim()
    };
  }

  handleChange(event) {
    this.setState({
      value: event.target.value,
    }, () => {
      this.props.onChange(event, this.state.value);
    });
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        let { highlightedIndex } = this.state;
        let index = (
          highlightedIndex === this.getSuggestions(this.state.value, this._compiledCommands).length - 1 ||
          this.state.isOpen === false
        ) ?  0 : highlightedIndex + 1;
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        let { highlightedIndex } = this.state;
        let index = (
          highlightedIndex === 0
        ) ? this.getSuggestions(this.state.value, this._compiledCommands).length - 1 : highlightedIndex - 1;
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
        break;
      case 'Enter':
        if (this.state.isOpen) {
          const command = this.getSuggestions(this.state.value, this._compiledCommands)[this.state.highlightedIndex];
          this.setState({
            value: command.token,
            isOpen: false,
            highlightedIndex: 0
          }, () => {
            this.refs.input.focus();
            this.refs.input.setSelectionRange(
              this.state.value.length,
              this.state.value.length
            );
            this.props.onSelect(this.state.value, command);
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

  getSuggestions(value, commands) {
    const results = fuzzy.filter(value, commands, {
      //pre: '<strong>',
      //post: '</strong>',
      extract: el => el.token
    });
    return results.map(result => result.original);
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
      this.props.onSelect(this.state.value, command);
      this.refs.input.focus();
      this.setIgnoreBlur(false);
    });
  }

  setIgnoreBlur(ignore) {
    this._ignoreBlur = ignore;
  }

  renderMenu() {
    const commands = this.getSuggestions(this.state.value, this._compiledCommands).map((command, index) => {
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

    return <div className={styles.menu} children={commands} ref='menu'/>;
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.inputArea}>
          <input
              ref="input"
              className={styles.input}
              onFocus={this.handleInputFocus}
              onBlur={this.handleInputBlur}
              onChange={(event) => this.handleChange(event)}
              onKeyDown={(event) => this.handleKeyDown(event)}
              onClick={this.handleInputClick}
              value={this.state.value}
          />
        </div>
        {this.state.isOpen && this.renderMenu()}
      </div>
    );
  }
}
FindBar.propTypes = {
  commands: PropTypes.array,
  initialValue: PropTypes.any,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
};

FindBar.defaultProps = {
  initialValue: '',
  onChange() {},
  onSelect(value, command) {}
};

module.exports = FindBar;
