import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List, Map } from 'immutable';
import { debounce, castArray } from 'lodash';
import Select from 'react-select/lib/Async';
import styles from './styles';
import * as defaultParams from './defaultParams';

const toJS = object => {
  if (object && typeof object.toJS === 'function') return object.toJS();
  return object;
};

const defaultProps = { queryHits: Map() };
const propTypes = {
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

const createControl = (customParams = {}) => {
  const params = { ...defaultParams, ...customParams };
  const { components, entryMapper, getSlug, getOptionValue } = params;

  return class CustomRelationControl extends React.Component {
    static defaultProps = defaultProps;
    static propTypes = propTypes;
    static displayName = params.displayName || 'CustomRelationControl';

    required = this.props.field.get('required', true);
    multiple = this.props.field.get('multiple', false);
    collection = params.collection || this.props.field.get('collection');
    searchFields = toJS(params.searchFields || this.props.field.get('searchFields'));

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
      const { props, collection, searchFields } = this;
      this.callback = value => {
        callback(value);
        this.callback = null;
      };
      this.props.query(props.forID, collection, searchFields, term);
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
          collection: this.collection,
          loadEntry: this.props.loadEntry,
        };
      return { entry: value };
    };

    shouldComponentUpdate() {
      return true;
    }

    render() {
      const { value, forID, classNameWrapper } = this.props;
      const { setActiveStyle, setInactiveStyle } = this.props;
      const isClearable = this.multiple || !this.required;
      const defaultValue = castArray(toJS(value));

      return (
        <Select
          inputId={forID}
          className={classNameWrapper}
          isMulti={this.multiple}
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
  };
};

export default createControl;
