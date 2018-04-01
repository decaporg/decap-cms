import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map } from 'immutable';

export default class SelectControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    forID: PropTypes.string.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
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

  static defaultProps = {
    value: '',
  };

  handleChange = (e) => {
    this.props.onChange(e.target.value);
  };

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
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
        return Map.isMap(option) ? option.toJS() : option;
      }),
    ];

    return (
      <select
        id={forID}
        value={value || ''}
        onChange={this.handleChange}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      >
        {
          options.map(
            (option, idx) => <option key={idx} value={option.value}>{option.label}</option>
          )
        }
      </select>
    );
  }
}
