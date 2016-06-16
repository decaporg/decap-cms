import React, { PropTypes } from 'react';

export default class StringControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    return <input value={this.props.value} onChange={this.handleChange}/>;
  }
}

StringControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
};
