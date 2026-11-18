import { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map, List, fromJS } from 'immutable';
import find from 'lodash/find';
import Select from 'react-select';
import { reactSelectStyles } from 'decap-cms-ui-default';
import { validations } from 'decap-cms-lib-widgets';

function optionToString(option) {
  return option && (typeof option.value === 'number' || typeof option.value === 'string')
    ? option.value
    : null;
}

function convertToOption(raw) {
  if (typeof raw === 'string') {
    return { label: raw, value: raw };
  }
  return Map.isMap(raw) ? raw.toJS() : raw;
}

function getOptions(field) {
  return [...field.get('options').map(convertToOption)];
}

function isFilterMatch(option, filter) {
  const values = [].concat(option[filter.field] ?? []);
  const filterValues = filter.values.map(String);
  return values.some(value => filterValues.includes(String(value)));
}

function getMatchingOptions(field) {
  const filters = List.isList(field.get('filters')) ? field.get('filters').toJS() : [];
  return getOptions(field).filter(option => filters.every(filter => isFilterMatch(option, filter)));
}

function getSelectedValue({ value, options, isMultiple }) {
  if (isMultiple) {
    const selectedOptions = List.isList(value) ? value.toJS() : value;

    if (!selectedOptions || !Array.isArray(selectedOptions)) {
      return null;
    }

    return selectedOptions
      .map(i => options.find(o => o.value === (i.value || i)))
      .filter(Boolean)
      .map(convertToOption);
  } else {
    return find(options, ['value', value]) || null;
  }
}

export default class SelectControl extends Component {
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
          PropTypes.number,
          ImmutablePropTypes.contains({
            label: PropTypes.string.isRequired,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          }),
        ]),
      ).isRequired,
    }),
  };

  isValid = () => {
    const { field, value, t } = this.props;
    const min = field.get('min');
    const max = field.get('max');

    if (!field.get('multiple')) {
      return { error: false };
    }

    const error = validations.validateMinMax(
      t,
      field.get('label', field.get('name')),
      value,
      min,
      max,
    );

    return error ? { error } : { error: false };
  };

  handleChange = selectedOption => {
    const { onChange, field } = this.props;
    const isMultiple = field.get('multiple', false);
    const isEmpty = isMultiple ? !selectedOption?.length : !selectedOption;

    if (field.get('required') && isEmpty && isMultiple) {
      onChange(List());
    } else if (isEmpty) {
      onChange(null);
    } else if (isMultiple) {
      const options = selectedOption.map(optionToString);
      onChange(fromJS(options));
    } else {
      onChange(optionToString(selectedOption));
    }
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(SelectControl.propTypes, this.props, 'prop', 'SelectControl');

    const { field, onChange, value } = this.props;
    if (field.get('required') && field.get('multiple')) {
      if (value && !List.isList(value)) {
        onChange(fromJS([value]));
      } else if (!value) {
        onChange(fromJS([]));
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.field.get('filters') !== this.props.field.get('filters')) {
      this.removeUnmatchedValues();
    }
  }

  removeUnmatchedValues() {
    const { field, value, onChange } = this.props;
    const allowed = getMatchingOptions(field).map(option => option.value);

    if (field.get('multiple', false)) {
      const selected = List.isList(value) ? value.toJS() : [];
      const kept = selected.filter(selectedValue => allowed.includes(selectedValue));
      if (kept.length < selected.length) {
        onChange(fromJS(kept));
      }
    } else if (value != null && value !== '' && !allowed.includes(value)) {
      onChange(null);
    }
  }

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;

    const options = getOptions(field);
    const selectedValue = getSelectedValue({
      options,
      value,
      isMultiple,
    });

    return (
      <Select
        inputId={forID}
        value={selectedValue}
        onChange={this.handleChange}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        options={getMatchingOptions(field)}
        styles={reactSelectStyles}
        isMulti={isMultiple}
        isClearable={isClearable}
        placeholder=""
      />
    );
  }
}
