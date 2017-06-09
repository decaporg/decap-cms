import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

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

    const options = fieldOptions.map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      return option;
    });

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
