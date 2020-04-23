import React from 'react';
import PropTypes from 'prop-types';

export default class PathControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  onChange = e => {
    const newValue = e.target.value;
    const { onChange, field } = this.props;
    onChange(undefined, { [field.get('name')]: { path: newValue } });
  };

  shouldComponentUpdate() {
    return true;
  }

  render() {
    const {
      forID,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
      entry,
      metadata,
    } = this.props;

    const value = metadata?.get('path') || entry?.get('path') || '';

    return (
      <input
        type="text"
        id={forID}
        className={classNameWrapper}
        value={value}
        onChange={this.onChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}
