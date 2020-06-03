import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Async as AsyncSelect } from 'react-select';
import { find, isEmpty, last, debounce, get, trimEnd } from 'lodash';
import { List, Map, fromJS } from 'immutable';
import { reactSelectStyles } from 'netlify-cms-ui-default';
import { stringTemplate } from 'netlify-cms-lib-widgets';

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

export const expandPath = ({ data, path, paths = [] }) => {
  if (path.endsWith('.*')) {
    path = path + '.';
  }

  const sep = '.*.';
  const parts = path.split(sep);
  if (parts.length === 1) {
    paths.push(path);
  } else {
    const partialPath = parts[0];
    const value = get(data, partialPath);

    if (Array.isArray(value)) {
      value.forEach((v, index) => {
        expandPath({
          data,
          path: trimEnd(`${partialPath}.${index}.${parts.slice(1).join(sep)}`, '.'),
          paths,
        });
      });
    }
  }

  return paths;
};

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
          const hit = hits.find(hit => this.parseNestedFields(hit, valueField) === val);
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

  parseNestedFields = (hit, field) => {
    const templateVars = stringTemplate.extractTemplateVars(field);
    // return non template fields as is
    if (templateVars.length <= 0) {
      return get(hit.data, field);
    }
    const data = stringTemplate.addFileTemplateFields(hit.path, fromJS(hit.data));
    const value = stringTemplate.compileStringTemplate(field, null, hit.slug, data);
    return value;
  };

  parseHitOptions = hits => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    const displayField = field.get('displayFields') || List([field.get('valueField')]);

    const options = hits.reduce((acc, hit) => {
      const valuesPaths = expandPath({ data: hit.data, path: valueField });
      for (let i = 0; i < valuesPaths.length; i++) {
        const label = displayField
          .toJS()
          .map(key => {
            const displayPaths = expandPath({ data: hit.data, path: key });
            return this.parseNestedFields(hit, displayPaths[i] || displayPaths[0]);
          })
          .join(' ');
        const value = this.parseNestedFields(hit, valuesPaths[i]);
        acc.push({ data: hit.data, value, label });
      }

      return acc;
    }, []);

    return options;
  };

  loadOptions = debounce((term, callback) => {
    const { field, query, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields');
    const optionsLength = field.get('optionsLength') || 20;
    const searchFieldsArray = List.isList(searchFields) ? searchFields.toJS() : [searchFields];
    const file = field.get('file');

    const queryPromise = file
      ? query(forID, collection, ['slug'], file)
      : query(forID, collection, searchFieldsArray, term);

    queryPromise.then(({ payload }) => {
      let options =
        payload.response && payload.response.hits
          ? this.parseHitOptions(payload.response.hits)
          : [];

      if (!this.allOptions && !term) {
        this.allOptions = options;
      }

      if (!term) {
        options = options.slice(0, optionsLength);
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
