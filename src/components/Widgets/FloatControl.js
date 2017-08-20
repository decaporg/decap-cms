import React, { PropTypes } from 'react';

export default class FloatControl extends React.Component {
  handleChange = (e) => {
    this.props.onChange(parseFloat(e.target.value));
  };

  render() {
    return <input type="number" id={this.props.forID} value={this.props.value || ''} onChange={this.handleChange} />;
  }
}

FloatControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
  forID: PropTypes.string,
};
