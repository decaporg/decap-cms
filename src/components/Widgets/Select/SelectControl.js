import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { isMap } from 'immutable';

export default class SelectControl extends React.Component {
  handleChange = (e) => {
    this.props.onChange(e.target.value);
  };

  render() {
    const { field, value, forID } = this.props;
    const fieldOptions = field.get('options');

    if (!fieldOptions) {
      return <div>Error rendering select control for {field.get('name')}: No options</div>;
    }

    const options = [
      ...(field.get('default', false) ? [] : [{ label: '', value: '' }]),
      ...fieldOptions.map((option) => {
        if (typeof option === 'string') {
          return { label: option, value: option };
        }
        return isMap(option) ? option.toJS() : option;
      }),
    ];

    return (<select id={forID} value={value || ''} onChange={this.handleChange}>
      {options.map((option, idx) => <option key={idx} value={option.value}>
        {option.label}
      </option>)}
    </select>);
  }
}

SelectControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.node,
  forID: PropTypes.string.isRequired,
  field: ImmutablePropTypes.contains({
    options: ImmutablePropTypes.listOf(PropTypes.oneOfType([
      PropTypes.string,
      ImmutablePropTypes.contains({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ])).isRequired,
  }),
};
