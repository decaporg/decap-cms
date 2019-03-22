import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
const ValidationErrorTypes = {
  PRESENCE: 'PRESENCE',
  PATTERN: 'PATTERN',
  RANGE: 'RANGE',
  CUSTOM: 'CUSTOM',
};

export default class NumberControl extends React.Component {
  static propTypes = {
    field: ImmutablePropTypes.map.isRequired,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    value: PropTypes.node,
    forID: PropTypes.string,
    valueType: PropTypes.string,
    step: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  handleChange = e => {
    const valueType = this.props.field.get('valueType');
    const { onChange } = this.props;
    const value = valueType === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value, 10);

    if (!isNaN(value)) {
      onChange(value);
    } else {
      onChange('');
    }
  };

  isValid = () => {
    const { field, value, t } = this.props;
    const hasPattern = !!field.get('pattern', false);
    const min = field.get('min', false);
    const max = field.get('max', false);
    let error;

    // Pattern overrides min/max logic always:
    if (hasPattern) {
      return true;
    }

    switch (true) {
      case min !== false && max !== false && (value < min || value > max):
        error = {
          type: ValidationErrorTypes.RANGE,
          message: t('editor.editorControlPane.widget.range', {
            fieldLabel: field.get('label', field.get('name')),
            minValue: min,
            maxValue: max,
          }),
        };
        break;
      case min !== false && value < min:
        error = {
          type: ValidationErrorTypes.RANGE,
          message: t('editor.editorControlPane.widget.min', {
            fieldLabel: field.get('label', field.get('name')),
            minValue: min,
          }),
        };
        break;
      case max !== false && value > max:
        error = {
          type: ValidationErrorTypes.RANGE,
          message: t('editor.editorControlPane.widget.max', {
            fieldLabel: field.get('label', field.get('name')),
            maxValue: max,
          }),
        };
        break;
      default:
        return true;
    }

    return { error };
  };

  render() {
    const { field, value, classNameWrapper, forID, setActiveStyle, setInactiveStyle } = this.props;
    const min = field.get('min', '');
    const max = field.get('max', '');
    const step = field.get('step', field.get('valueType') === 'int' ? 1 : '');
    return (
      <input
        type="number"
        id={forID}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        value={value || ''}
        step={step}
        min={min}
        max={max}
        onChange={this.handleChange}
      />
    );
  }
}
