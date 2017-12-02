import PropTypes from 'prop-types';
import React from 'react';

export default class StringControl extends React.Component {
  handleChange = (e) => {
    this.props.onChange(e.target.value);
  };

  render() {
    const { forID, value, className, setActiveStyle, setInactiveStyle } = this.props;
    return (
      <input
        type="text"
        id={forID}
        className={className}
        value={value || ''}
        onChange={this.handleChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}

StringControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.node,
};
