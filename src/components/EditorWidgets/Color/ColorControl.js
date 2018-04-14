import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { SketchPicker } from 'react-color';

const DEFAULT_FORMAT = 'hex';
const DEFAULT_COLOR = '#ffffff';

export default class ColorControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    field: ImmutablePropTypes.mapContains({
      format: PropTypes.oneOf(['hex', 'rgb', 'hsl']),
      default: PropTypes.string,
      presets: ImmutablePropTypes.list,
      alpha: PropTypes.bool,
    }),
    forID: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  format = this.props.field.get('format') || DEFAULT_FORMAT;
  alpha = !this.props.field.get('alpha', true);

  handleChangeComplete = (color) => {
    let selected = color[this.format];
    if (typeof selected !== 'string') {
      const type = `${ this.format }${ this.alpha ? 'a' : '' }`;
      const value = Object.values(selected).join(', ');

      selected = `${ type }(${ value })`;
    }
    this.props.onChange(selected);
  };

  render() {
    const { forID, field, value, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;

    const props = {
      presetColors: undefined,
      color: value || field.get('default') || DEFAULT_COLOR,
      disableAlpha: !field.get('alpha', true),
    };

    if (field.has('presets')) {
      props.presetColors = field.get('presets').toArray();
    }

    return (
      <SketchPicker
        id={forID}
        className={classNameWrapper}
        onChangeComplete={this.handleChangeComplete}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        {...props}
      />
    );
  }
}
