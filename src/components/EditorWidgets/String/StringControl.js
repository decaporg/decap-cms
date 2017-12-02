import PropTypes from 'prop-types';
import React from 'react';

export default class StringControl extends React.Component {
  render() {
    const { forID, value, onChange, className, setActiveStyle, setInactiveStyle } = this.props;
    return (
      <input
        type="text"
        id={forID}
        className={className}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
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
