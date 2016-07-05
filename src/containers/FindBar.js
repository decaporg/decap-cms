import React, { PropTypes } from 'react';
import fuzzy from 'fuzzy';
import _ from 'lodash';
import { connect } from 'react-redux';

class FindBar extends React.Component {
  constructor(props) {
    super(props);
    this.compiledCommands = {};
    this.state = {
      prompt: '',
      value: '',
      suggestions: []
    };

    this.compileCommand = this.compileCommand.bind(this);
    this.matchCommand = this.matchCommand.bind(this);
    this.getSuggestions = _.throttle(this.getSuggestions.bind(this), 200);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    this.compiledCommands = this.props.commands.map(this.compileCommand);
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _camelCaseToSpace(string) {
    var result = string.replace(/([A-Z])/g, ' $1');
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

  getSuggestions(value) {
    console.log(value);
    const options = {
      //pre: '<strong>',
      //post: '</strong>',
      extract: el => el. token
    };
    const results = fuzzy.filter(value, this.compiledCommands, options);

    return results;
  }

  handleInputChange(e) {
    const newValue = e.target.value;
    this.setState({
      value: newValue,
      suggestions: this.getSuggestions(newValue)
    });
  }

  render() {
    return (
      <input
          type='text'
          prompt={this.state.prompt}
          value={this.state.value}
          onChange={this.handleInputChange}
      />
    );
  }
}

FindBar.propTypes = {
  commands: PropTypes.array.isRequired
};

export default connect(null)(FindBar);
