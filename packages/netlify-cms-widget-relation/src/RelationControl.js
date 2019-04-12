import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import AsyncSelect from 'react-select/lib/Async';
import { find, isEmpty, last, debounce } from 'lodash';
import { List, Map, fromJS } from 'immutable';
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
      .map(i => options.find(o => o.value === (i.value || i)))
      .filter(Boolean)
      .map(convertToOption);
  } else {
    return find(options, ['value', value]) || null;
  }
}

export default class RelationControl extends React.Component {
  didInitialSearch = false;

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    value: PropTypes.node,
    field: ImmutablePropTypes.map,
    fetchID: PropTypes.string,
    query: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  shouldComponentUpdate(nextProps) {
    return (
      this.props.value !== nextProps.value ||
      this.props.hasActiveStyle !== nextProps.hasActiveStyle ||
      this.props.queryHits !== nextProps.queryHits
    );
  }

  componentDidUpdate(prevProps) {
    /**
     * Load extra post data into the store after first query.
     */
    if (this.didInitialSearch) return;
    const { value, field, forID, queryHits, onChange } = this.props;

    if (queryHits !== prevProps.queryHits && queryHits.get(forID)) {
      this.didInitialSearch = true;
      const valueField = field.get('valueField');
      const hits = queryHits.get(forID);
      if (value) {
        const listValue = List.isList(value) ? value : List([value]);
        listValue.forEach(val => {
          const hit = hits.find(i => i.data[valueField] === val);
          if (hit) {
            onChange(value, {
              [field.get('name')]: {
                [field.get('collection')]: { [val]: hit.data },
              },
            });
          }
        });
      }
    }
  }

  handleChange = selectedOption => {
    const { onChange, field } = this.props;
    let value;
    let metadata;

    if (Array.isArray(selectedOption)) {
      value = selectedOption.map(optionToString);
      metadata =
        (!isEmpty(selectedOption) && {
          [field.get('name')]: {
            [field.get('collection')]: {
              [last(value)]: last(selectedOption).data,
            },
          },
        }) ||
        {};
      onChange(fromJS(value), metadata);
    } else {
      value = optionToString(selectedOption);
      metadata = selectedOption && {
        [field.get('name')]: {
          [field.get('collection')]: { [value]: selectedOption.data },
        },
      };
      onChange(value, metadata);
    }
  };

  parseHitOptions = hits => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    const displayField = field.get('displayFields') || field.get('valueField');

    return hits.map(hit => {
      return {
        data: hit.data,
        value: hit.data[valueField],
        label: List.isList(displayField)
          ? displayField
              .toJS()
              .map(key => hit.data[key])
              .join(' ')
          : hit.data[displayField],
      };
    });
  };

  loadOptions = debounce((term, callback) => {
    const { field, query, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields');
    const searchFieldsArray = List.isList(searchFields) ? searchFields.toJS() : [searchFields];

    query(forID, collection, searchFieldsArray, term).then(({ payload }) => {
      let options = this.parseHitOptions(payload.response.hits);

      if (!this.allOptions && !term) {
        this.allOptions = options;
      }

      if (!term) {
        options = options.slice(0, 20);
      }

      callback(options);
    });
  }, 500);

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
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;

    const hits = queryHits.get(forID, []);
    const options = this.allOptions || this.parseHitOptions(hits);
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
        loadOptions={this.loadOptions}
        onChange={this.handleChange}
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
