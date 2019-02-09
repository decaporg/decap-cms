import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import AsyncSelect from 'react-select/lib/Async';
import { find } from 'lodash';
import { List, fromJS } from 'immutable';
import { reactSelectStyles } from 'netlify-cms-ui-default';

function optionToString(option) {
  return option && option.value ? option.value : '';
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
      .filter(i => options.find(o => o.value === (i.value || i)))
      .map(convertToOption);
  } else {
    return find(options, ['value', value]) || null;
  }
}

export default class RelationControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: ImmutablePropTypes.map,
    isFetching: PropTypes.bool,
    fetchID: PropTypes.string,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  handleChange = selectedOption => {
    const { onChange } = this.props;

    if (Array.isArray(selectedOption)) {
      onChange(fromJS(selectedOption.map(optionToString)));
    } else {
      onChange(optionToString(selectedOption));
    }
  };

  loadOptions = (term, callback) => {
    const { field, query, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    const valueField = field.get('valueField');
    const displayField = field.get('displayFields') || field.get('valueField');

    query(forID, collection, searchFields, term).then(({ payload }) => {
      const hits = term === '' ? payload.response.hits.slice(0, 20) : payload.response.hits;
      const options = hits.map(i => {
        if (List.isList(displayField)) {
          return {
            value: i.data[valueField],
            label: displayField
              .toJS()
              .map(key => i.data[key])
              .join(' '),
          };
        }
        return { value: i.data[valueField], label: i.data[displayField] };
      });

      callback(options);
    });
  };

  render() {
    const {
      value,
      field,
      forID,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
      queryHits,
    } = this.props;
    const valueField = field.get('valueField');
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;

    const hits = queryHits.get(forID, []);
    const options = hits.map(i => convertToOption(i.data[valueField]));
    const selectedValue = getSelectedValue({
      options,
      value,
      isMultiple,
    });

    return (
      <AsyncSelect
        value={selectedValue}
        inputId={forID}
        defaultOptions
        onChange={this.handleChange}
        loadOptions={this.loadOptions}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        styles={reactSelectStyles}
        isMulti={isMultiple}
        isClearable={isClearable}
        placeholder=""
      />
    );
  }
}
