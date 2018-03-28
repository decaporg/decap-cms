import React from 'react';
import PropTypes from 'prop-types';

export default class NumberControl extends React.Component {
  static propTypes = {
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
  };

  static defaultProps = {
    value: '',
  };

  handleChange = (e) => {
    const valueType = this.props.field.get('valueType');
    const { onChange } = this.props;
    if(valueType === 'int') {
      onChange(parseInt(e.target.value, 10));
    } else if(valueType === 'float') {
      onChange(parseFloat(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  render() {
    const { field, value, classNameWrapper, forID, setActiveStyle, setInactiveStyle } = this.props;
    const min = field.get('min', '');
    const max = field.get('max', '');
    const step = field.get('step', field.get('valueType') === 'int' ? 1 : '');
    return <input
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
    />;
  }
}
