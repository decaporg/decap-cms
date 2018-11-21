import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map } from 'immutable';
import { find } from 'lodash';
import Select from 'react-select';
import { colors } from 'netlify-cms-ui-default';

const styles = {
  control: provided => ({
    ...provided,
    border: 0,
    boxShadow: 'none',
    padding: '9px 0 9px 12px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? `${colors.active}`
      : state.isFocused
        ? `${colors.activeBackground}`
        : 'transparent',
    paddingLeft: '22px',
  }),
  menu: provided => ({ ...provided, right: 0 }),
  container: provided => ({ ...provided, padding: '0 !important' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: provided => ({ ...provided, color: `${colors.controlLabel}` }),
};

export default class SelectControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    forID: PropTypes.string.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    field: ImmutablePropTypes.contains({
      options: ImmutablePropTypes.listOf(
        PropTypes.oneOfType([
          PropTypes.string,
          ImmutablePropTypes.contains({
            label: PropTypes.string.isRequired,
            value: PropTypes.string.isRequired,
          }),
        ]),
      ).isRequired,
    }),
  };

  static defaultProps = {
    value: '',
  };

  handleChange = selectedOption => {
    this.props.onChange(selectedOption['value']);
  };

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const fieldOptions = field.get('options');

    if (!fieldOptions) {
      return <div>Error rendering select control for {field.get('name')}: No options</div>;
    }

    const options = [
      ...(field.get('default', false) ? [] : [{ label: '', value: '' }]),
      ...fieldOptions.map(option => {
        if (typeof option === 'string') {
          return { label: option, value: option };
        }
        return Map.isMap(option) ? option.toJS() : option;
      }),
    ];

    const selectedValue = find(options, ['value', value]);

    return (
      <Select
        id={forID}
        value={selectedValue}
        onChange={this.handleChange}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        options={options}
        styles={styles}
      />
    );
  }
}
