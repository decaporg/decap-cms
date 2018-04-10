import PropTypes from 'prop-types';
import React from 'react';

export default class ColorControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  render() {
    const {
      forID,
      value,
      onChange,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;

    return (
      <input
        type="color"
        id={forID}
        className={classNameWrapper}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ backgroundColor: value || '' }}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}
