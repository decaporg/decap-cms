import React, { Component, PropTypes } from 'react';

export default class ListControl extends Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
  };
  handleChange = (e) => {
    this.props.onChange(e.target.value.split(',').map(item => item.trim()));
  };

  render() {
    const { value } = this.props;
    return <input type="text" value={value ? value.join(', ') : ''} onChange={this.handleChange} />;
  }
}
