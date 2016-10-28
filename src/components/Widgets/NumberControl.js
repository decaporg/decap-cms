import React, { PropTypes } from 'react';

export default class StringControl extends React.Component {
  handleChange = e => {
    this.props.onChange(e.target.value);
  };

  render() {
    return <input type="number" value={this.props.value || ''} onChange={this.handleChange}/>;
  }
}

StringControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
