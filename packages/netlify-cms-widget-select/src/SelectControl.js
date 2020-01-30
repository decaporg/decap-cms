import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map, List, fromJS } from 'immutable';
import { find, isNumber } from 'lodash';
import Select from 'react-select';
import { reactSelectStyles } from 'netlify-cms-ui-default';

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
    if (!field.get('multiple')) {
      return { error: false };
    }
    if ([min, max].every(isNumber)) {
      const isValid = value && value.size >= min && value.size <= max;
      const messageKey = min === max ? 'rangeCountExact' : 'rangeCount';
      if (!isValid) {
        return {
          error: {
            message: t(`editor.editorControlPane.widget.${messageKey}`, {
              fieldLabel: field.get('label', field.get('name')),
              minValue: min,
              maxValue: max,
            }),
          },
        };
      }
    } else if (isNumber(min)) {
      const isValid = value && value.size >= min;
      if (!isValid) {
        return {
          error: {
            message: t('editor.editorControlPane.widget.rangeMin', {
              fieldLabel: field.get('label', field.get('name')),
              minValue: min,
            }),
          },
        };
      }
    } else if (isNumber(max)) {
      const isValid = !value || value.size <= max;
      if (!isValid) {
        return {
          error: {
            message: t('editor.editorControlPane.widget.rangeMax', {
              fieldLabel: field.get('label', field.get('name')),
              maxValue: max,
            }),
          },
        };
      }
    }
    return { error: false };
  };

  handleChange = selectedOption => {
    const { onChange, field } = this.props;
    const isMultiple = field.get('multiple', false);

    if (Array.isArray(selectedOption)) {
      if (!isMultiple && selectedOption.length === 0) {
        onChange(null);
      } else {
        onChange(fromJS(selectedOption.map(optionToString)));
      }
    } else {
      onChange(optionToString(selectedOption));
    }
  };

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
