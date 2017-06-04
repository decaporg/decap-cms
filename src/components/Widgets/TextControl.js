import React, { PropTypes } from 'react';

export default class StringControl extends React.Component {
  componentDidMount() {
    this.updateHeight();
  }

  handleChange = (e) => {
    this.props.onChange(e.target.value);
    this.updateHeight();
  };

  updateHeight() {
    if (this.element.scrollHeight > this.element.clientHeight) {
      this.element.style.height = `${ this.element.scrollHeight }px`;
    }
  }

  handleRef = (ref) => {
    this.element = ref;
  };

  render() {
    return <textarea ref={this.handleRef} id={this.props.forID} value={this.props.value || ''} onChange={this.handleChange} />;
  }
}

StringControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.node,
};
