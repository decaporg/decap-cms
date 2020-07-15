import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Async as AsyncSelect } from 'react-select';
import { find, isEmpty, last, debounce, get } from 'lodash';
import { List, Map, fromJS } from 'immutable';
import { reactSelectStyles } from 'netlify-cms-ui-default';
import { stringTemplate } from 'netlify-cms-lib-widgets';
import { FixedSizeList } from 'react-window';

const Option = ({ index, style, data }) => <div style={style}>{data.options[index]}</div>;

const MenuList = props => {
  if (props.isLoading || props.options.length <= 0) {
    return props.children;
  }
  const rows = props.children;
  return (
    <FixedSizeList
      style={{ width: '100%' }}
      width={300}
      height={300}
      itemCount={rows.length}
      itemSize={30}
      itemData={{ options: rows }}
    >
      {Option}
    </FixedSizeList>
  );
};

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

  state = {
    initialOptions: [],
  };

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
      const valuesPaths = stringTemplate.expandPath({ data: hit.data, path: valueField });
      for (let i = 0; i < valuesPaths.length; i++) {
        const label = displayField
          .toJS()
          .map(key => {
            const displayPaths = stringTemplate.expandPath({ data: hit.data, path: key });
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
    const { field, query, forID, value } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields');
    const optionsLength = field.get('optionsLength') || 20;
    const searchFieldsArray = List.isList(searchFields) ? searchFields.toJS() : [searchFields];
    const file = field.get('file');

    // if the field has a previous value perform an initial search based on the value field
    // and display it as the first option.
    // this is required since each search is limited by optionsLength so the selected value
    // might not show up on the first search
    let initialSearchPromise = Promise.resolve([]);
    if (!this.didInitialSearch && value && !term) {
      initialSearchPromise = query(
        forID,
        collection,
        [field.get('valueField')],
        value,
        file,
        1,
      ).then(({ payload }) => {
        const hits = payload.response?.hits || [];
        const options = this.parseHitOptions(hits);
        return options;
      });
    }

    initialSearchPromise.then(initialOptions => {
      this.setState({ initialOptions });
      query(forID, collection, searchFieldsArray, term, file, optionsLength).then(({ payload }) => {
        const hits = payload.response?.hits || [];
        const options = this.parseHitOptions(hits);
        callback(initialOptions.concat(options));
      });
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
    const options = this.parseHitOptions(hits);
    const selectedValue = getSelectedValue({
      options: this.state.initialOptions.concat(options),
      value,
      isMultiple,
    });

    return (
      <AsyncSelect
        components={{ MenuList }}
        value={selectedValue}
        inputId={forID}
        cacheOptions
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
