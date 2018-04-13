import PropTypes from 'prop-types';
import React from 'react';
import { SketchPicker } from 'react-color';

const DEFAULT_FORMAT = 'hex';
const DEFAULT_COLOR = '#ffffff';

export default class ColorControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    field: PropTypes.object,
    forID: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
    ]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  format = this.props.field.get('format') || DEFAULT_FORMAT;
  defaultColor = this.props.field.get('default') || DEFAULT_COLOR;

  handleChangeComplete = (color) => {
    // TODO: convert hsl/rgb to string for consistent value
    this.props.onChange(color[this.format]);
  };

  render() {
    const {
      forID,
      value,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;

    return (
      <SketchPicker
        id={forID}
        className={classNameWrapper}
        color={value || this.defaultColor}
        onChangeComplete={this.handleChangeComplete}
        style={{ backgroundColor: value || '' }}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}
