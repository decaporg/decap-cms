import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map, List, fromJS } from 'immutable';
import { find, isNumber } from 'lodash';
import Select from 'react-select';
import { reactSelectStyles } from 'netlify-cms-ui-legacy';

function optionToString(option) {
  return option && option.value ? option.value : null;
}

function convertToOption(raw) {
  if (typeof raw === 'string') {
    return { label: raw, value: raw };
  }
  return Map.isMap(raw) ? raw.toJS() : raw;
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

  isValid = () => {
    const { field, value, t } = this.props;
    const min = field.get('min');
    const max = field.get('max');
    const minMaxError = messageKey => ({
      error: {
        message: t(`editor.editorControlPane.widget.${messageKey}`, {
          fieldLabel: field.get('label', field.get('name')),
          minCount: min,
          maxCount: max,
          count: min,
        }),
      },
    });

    if (!field.get('multiple')) {
      return { error: false };
    }
    if ([min, max].every(isNumber) && value?.size && (value.size < min || value.size > max)) {
      return minMaxError(min === max ? 'rangeCountExact' : 'rangeCount');
    } else if (isNumber(min) && min > 0 && value?.size && value.size < min) {
      return minMaxError('rangeMin');
    } else if (isNumber(max) && value?.size && value.size > max) {
      return minMaxError('rangeMax');
    }
    return { error: false };
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
    const { field, onChange, value } = this.props;
    if (field.get('required') && field.get('multiple')) {
      if (value && !List.isList(value)) {
        onChange(fromJS([value]));
      } else if (!value) {
        onChange(fromJS([]));
      }
    }
  }

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const fieldOptions = field.get('options');
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;

    if (!fieldOptions) {
      return <div>Error rendering select control for {field.get('name')}: No options</div>;
    }

    const options = [...fieldOptions.map(convertToOption)];
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
        options={options}
        styles={reactSelectStyles}
        isMulti={isMultiple}
        isClearable={isClearable}
        placeholder=""
      />
    );
  }
}
