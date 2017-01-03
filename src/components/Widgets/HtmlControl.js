import React, { PropTypes } from 'react';
import CodeMirror from 'react-codemirror';

import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

export default class StringControl extends React.Component {
  componentDidMount() {
    this.updateHeight();
  }

  handleChange = (newValue) => {
    this.props.onChange(newValue);
  };

  updateHeight() {
    this.element.codeMirror.setSize(null, 'auto');
  }

  handleRef = (ref) => {
    this.element = ref;
  };

  render() {
    const options = {
      lineNumbers: false,
    };

    return (
      <CodeMirror
        ref={this.handleRef}
        value={this.props.value || ''}
        onChange={this.handleChange}
        options={options}
      />
    );
  }
}

StringControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
