import React, { PropTypes } from 'react';

export default class NumberControl extends React.Component {
  handleChange = (e) => {
    const valueType = this.props.field.get('valueType')
    let value
    if(valueType === 'int') {
      value = parseInt(e.target.value, 10)
    } else if(valueType === 'float') {
      value = parseFloat(e.target.value)
    } else {
      value = e.target.value
    }
    this.props.onChange(value);
  };

  render() {
    const { field, value, forID } = this.props
    const min = field.get('min')
    const max = field.get('max')
    const step = field.get('step')
    return <input type="number" id={forID} value={value || ''} step={step == null ? (field.get('valueType') === 'int' ? 1 : '') : step} min={min == null ? '' : min} max={max == null ? '' : max} onChange={this.handleChange} />;
  }
}

NumberControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
  forID: PropTypes.string,
  valueType: PropTypes.string,
  step: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
};
