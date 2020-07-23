import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Async as AsyncSelect } from 'react-select';
import { find, isEmpty, last, debounce, get, uniqBy, sortBy } from 'lodash';
import { List, Map, fromJS } from 'immutable';
import { reactSelectStyles } from 'netlify-cms-ui-default';
import { stringTemplate } from 'netlify-cms-lib-widgets';
import { FixedSizeList } from 'react-window';

const Option = ({ index, style, data }) => <div style={style}>{data.options[index]}</div>;

const MenuList = props => {
  if (props.isLoading || props.options.length <= 0 || !Array.isArray(props.children)) {
    return props.children;
  }
  const rows = props.children;
  const itemSize = 30;
  return (
    <FixedSizeList
      style={{ width: '100%' }}
      width={300}
      height={Math.min(300, rows.length * itemSize + itemSize / 3)}
      itemCount={rows.length}
      itemSize={itemSize}
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

function getSelectedOptions(value) {
  const selectedOptions = List.isList(value) ? value.toJS() : value;

  if (!selectedOptions || !Array.isArray(selectedOptions)) {
    return null;
  }

  return selectedOptions;
}

function uniqOptions(initial, current) {
  return uniqBy(initial.concat(current), o => o.value);
}

function getSelectedValue({ value, options, isMultiple }) {
  if (isMultiple) {
    const selectedOptions = getSelectedOptions(value);
    if (selectedOptions === null) {
      return null;
    }

    const selected = selectedOptions
      .map(i => options.find(o => o.value === (i.value || i)))
      .filter(Boolean)
      .map(convertToOption);
    return selected;
  } else {
    return find(options, ['value', value]) || null;
  }
}

export default class RelationControl extends React.Component {
  didInitialSearch = false;
  mounted = false;

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

  async componentDidMount() {
    this.mounted = true;
    // if the field has a previous value perform an initial search based on the value field
    // this is required since each search is limited by optionsLength so the selected value
    // might not show up on the search
    const { forID, field, value, query } = this.props;
    const collection = field.get('collection');
    const file = field.get('file');
    const initialSearchValues = this.isMultiple() ? getSelectedOptions(value) : [value];
    if (initialSearchValues && initialSearchValues.length > 0) {
      const allOptions = await Promise.all(
        initialSearchValues.map((v, index) => {
          return query(forID, collection, [field.get('valueField')], v, file, 1).then(
            ({ payload }) => {
              const hits = payload.response?.hits || [];
              const options = this.parseHitOptions(hits);
              return { options, index };
            },
          );
        }),
      );

      const initialOptions = [].concat(
        ...sortBy(allOptions, ({ index }) => index).map(({ options }) => options),
      );
      this.mounted && this.setState({ initialOptions });
    }
  }

  componentWillUnmount() {
    this.mounted = false;
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
      this.setState({ initialOptions: selectedOption });
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
      this.setState({ initialOptions: [selectedOption] });
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

  isMultiple() {
    return this.props.field.get('multiple', false);
  }

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
    const { field, query, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields');
    const optionsLength = field.get('optionsLength') || 20;
    const searchFieldsArray = List.isList(searchFields) ? searchFields.toJS() : [searchFields];
    const file = field.get('file');

    query(forID, collection, searchFieldsArray, term, file, optionsLength).then(({ payload }) => {
      const hits = payload.response?.hits || [];
      const options = this.parseHitOptions(hits);
      const uniq = uniqOptions(this.state.initialOptions, options);
      callback(uniq);
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
    const isMultiple = this.isMultiple();
    const isClearable = !field.get('required', true) || isMultiple;

    const hits = queryHits.get(forID, []);
    const queryOptions = this.parseHitOptions(hits);
    const options = uniqOptions(this.state.initialOptions, queryOptions);
    const selectedValue = getSelectedValue({
      options,
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
