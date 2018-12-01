import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List, Map } from 'immutable';
import { debounce, castArray } from 'lodash';
import Select from 'react-select/lib/Async';
import BaseOption from 'react-select/lib/components/Option';
import BaseSingleValue from 'react-select/lib/components/SingleValue';
import { colors } from 'netlify-cms-ui-default';
import EntryLoader from './EntryLoader';

const getOptionValue = option => option && (option.value || option.slug || option);

// TODO: add support for setting custom identifier field #1543
// TODO: export a factory to create custom Option UI
const Option = ({ data = {}, ...props }) => <BaseOption {...props}>{data.title}</BaseOption>;
Option.propTypes = { data: PropTypes.object };

const toJS = object => {
  if (object && typeof object.toJS === 'function') return object.toJS();
  return object;
};

// TODO: add support for setting custom identifier field #1543
// TODO: export a factory to create custom Value UI
const ValueRenderer = props => (
  <EntryLoader {...props}>
    {({ isLoading, isFetching, title, error }) => {
      if (isLoading || isFetching) return '...';
      if (error) return error;
      return title || 'Unknown Entity';
    }}
  </EntryLoader>
);

ValueRenderer.propTypes = { ...EntryLoader.propTypes };

const MultiValueLabel = ({ children: entry, innerProps }) => (
  <div {...innerProps}>
    <ValueRenderer {...entry} />
  </div>
);

MultiValueLabel.propTypes = {
  children: PropTypes.object,
  innerProps: PropTypes.object,
};

const SingleValue = ({ children: entry, ...props }) => (
  <BaseSingleValue {...props}>
    <ValueRenderer {...entry} />
  </BaseSingleValue>
);

SingleValue.propTypes = { children: PropTypes.object };
const components = { SingleValue, MultiValueLabel, Option };

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
  menu: styles => ({ ...styles, right: 0, zIndex: 2 }),
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

const entryMapper = ({ data, slug }) => ({ ...data, value: slug, type: 'option' });
const getSlug = value => value && (value.value || value);

export default class RelationControl extends React.Component {
  static defaultProps = {
    queryHits: Map(),
  };
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
    queryHits: ImmutablePropTypes.map.isRequired,
    value: PropTypes.oneOfType([ImmutablePropTypes.list.isRequired, PropTypes.string]),
    field: ImmutablePropTypes.map.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    query: PropTypes.func.isRequired,
    loadEntry: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  componentDidUpdate(prevProps) {
    if (!this.callback) return;
    if (
      this.props.queryHits !== prevProps.queryHits &&
      this.props.queryHits.get(this.props.forID)
    ) {
      const queryHits = this.props.queryHits.get(this.props.forID, []);
      return this.callback(queryHits.map(entryMapper));
    }
  }

  handleChange = value =>
    this.props.onChange(Array.isArray(value) ? List(value.map(getSlug)) : getSlug(value));

  loadOptions = debounce((term, callback) => {
    const { field, forID } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    this.callback = value => {
      callback(value);
      this.callback = null;
    };
    this.props.query(forID, collection, searchFields, term);
  }, 250);

  handleMenuClose = () => {
    this.props.clearSearch();
    this.callback = null;
  };

  formatOptionLabel = (value, { context }) => {
    if (context === 'menu') return value;
    if (typeof value === 'string')
      return {
        slug: value,
        collection: this.props.field.get('collection'),
        loadEntry: this.props.loadEntry,
      };
    return { entry: value };
  };

  shouldComponentUpdate() {
    return true;
  }

  render() {
    const { field, value, forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;
    const isMultiple = field.get('multiple', false);
    const isClearable = !field.get('required', true) || isMultiple;
    const defaultValue = castArray(toJS(value));

    return (
      <Select
        inputId={forID}
        className={classNameWrapper}
        isMulti={isMultiple}
        defaultValue={defaultValue}
        onChange={this.handleChange}
        openMenuOnClick={false}
        isClearable={isClearable}
        components={components}
        styles={styles}
        cacheOptions={forID}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        formatOptionLabel={this.formatOptionLabel}
        getOptionValue={getOptionValue}
        onMenuClose={this.handleMenuClose}
        loadOptions={this.loadOptions}
      />
    );
  }
}
