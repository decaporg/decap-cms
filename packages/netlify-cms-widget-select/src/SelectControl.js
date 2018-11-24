import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map, List, fromJS } from 'immutable';
import { find } from 'lodash';
import Select from 'react-select';
import { colors } from 'netlify-cms-ui-default';

const styles = {
  control: styles => ({
    ...styles,
    border: 0,
    boxShadow: 'none',
    padding: '9px 0 9px 12px',
  }),
  option: (styles, state) => ({
    ...styles,
    backgroundColor: state.isSelected
      ? `${colors.active}`
      : state.isFocused
        ? `${colors.activeBackground}`
        : 'transparent',
    paddingLeft: '22px',
  }),
  menu: styles => ({ ...styles, right: 0 }),
  container: styles => ({ ...styles, padding: '0 !important' }),
  indicatorSeparator: (styles, state) =>
    state.hasValue && state.selectProps.isClearable
      ? { ...styles, backgroundColor: `${colors.textFieldBorder}` }
      : { display: 'none' },
  dropdownIndicator: styles => ({ ...styles, color: `${colors.controlLabel}` }),
  clearIndicator: styles => ({ ...styles, color: `${colors.controlLabel}` }),
  multiValue: styles => ({
    ...styles,
    backgroundColor: colors.background,
  }),
  multiValueLabel: styles => ({
    ...styles,
    color: colors.textLead,
    fontWeight: 500,
  }),
  multiValueRemove: styles => ({
    ...styles,
    color: colors.controlLabel,
    ':hover': {
      color: colors.errorText,
      backgroundColor: colors.errorBackground,
    },
  }),
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

  handleChange = selectedOption => {
    const { field, onChange } = this.props;

    if (field.get('multiple')) {
      onChange(selectedOption.length ? fromJS(selectedOption.map(i => i.value)) : '');
    } else {
      onChange(selectedOption && selectedOption.value ? selectedOption.value : '');
    }
  };

  convertToOption = raw => {
    if (typeof raw === 'string') {
      return { label: raw, value: raw };
    }
    return Map.isMap(raw) ? raw.toJS() : raw;
  };

  getSelectedValue = ({ value, defaultValue, multiple, options }) => {
    const rawSelectedValue = value != null ? value : defaultValue;

    if (multiple) {
      const selectedOptions = List.isList(rawSelectedValue)
        ? rawSelectedValue.toJS()
        : rawSelectedValue;

      if (!selectedOptions || !Array.isArray(selectedOptions)) {
        return null;
      }

      return selectedOptions
        .filter(i => options.find(o => o.value === (i.value || i)))
        .map(this.convertToOption);
    } else {
      return find(options, ['value', rawSelectedValue]) || null;
    }
  };

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const fieldOptions = field.get('options');
    const multiple = field.get('multiple');
    const clearable = !!field.get('optional') || multiple;

    if (!fieldOptions) {
      return <div>Error rendering select control for {field.get('name')}: No options</div>;
    }

    const options = [...fieldOptions.map(this.convertToOption)];
    const selectedValue = this.getSelectedValue({
      options,
      value,
      multiple,
      defaultValue: field.get('default'),
    });

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
        isMulti={multiple}
        placeholder=""
        isClearable={clearable}
      />
    );
  }
}
