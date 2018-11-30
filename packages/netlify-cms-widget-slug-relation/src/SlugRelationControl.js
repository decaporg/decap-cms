import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import uuid from 'uuid/v4';
import { List, Map } from 'immutable';
import { debounce } from 'lodash';
import styled from 'react-emotion';
import AsyncSelect from 'react-select/lib/Async';
import BaseOption from 'react-select/lib/components/Option';
import BaseSingleValue from 'react-select/lib/components/SingleValue';
import EntryLoader from './EntryLoader'

const getOptionValue = option => option.value || option.slug || option

// TODO: add support for setting custom identifier field #1543
// TODO: export a factory to create custom Option UI
const Option = ({data = {}, ...props}) => (
  <BaseOption {...props}>{data.title}</BaseOption>
)
Option.propTypes = {data: PropTypes.object}

const toJS = object => {
  if(object && typeof object.toJS === 'function') return object.toJS()
  return object
}

// TODO: add support for setting custom identifier field #1543
// TODO: export a factory to create custom Value UI
const ValueRenderer = props => (
  <EntryLoader {...props}>
    {({isLoading, title, error}) => {
      if(isLoading) return '...'
      if(error) return error
      return title || 'Unknown Entity'
    }}
  </EntryLoader>
)

ValueRenderer.propTypes = {...EntryLoader.propTypes}

const MultiValueLabel = ({children: entry, innerProps}) => (
  <div {...innerProps}>
    <ValueRenderer {...entry}/>
  </div>
)

MultiValueLabel.propTypes = {
  children: PropTypes.object,
  innerProps: PropTypes.object,
}

const SingleValue = ({children: entry, ...props}) => (
  <BaseSingleValue {...props}>
    <ValueRenderer {...entry}/>
  </BaseSingleValue>
)

SingleValue.propTypes = {children: PropTypes.object}

const Select = styled(AsyncSelect)`z-index: 2;`
const Wrapper = styled.div`padding: 0 !important;`

const styles = {
  control: (provided) => ({
    ...provided,
    border: '0px solid transparent',
    borderRadius: '3px',
    borderTopLeftRadius: '0',
    boxShadow: 'none',
    minHeight: '54px',
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '8px 14px',
  }),
}

const IndicatorSeparator = () => null
const DropdownIndicator = () => null
const entryMapper = ({data, slug}) => ({...data, value: slug, type: 'option'})
const getSlug = value => (value.value || value)

export default class RelationControl extends React.Component {
  static defaultProps = {
    queryHits: Map(),
  }
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    queryHits: ImmutablePropTypes.map.isRequired,
    value: PropTypes.oneOfType([
      ImmutablePropTypes.list.isRequired,
      PropTypes.string,
    ]),
    field: ImmutablePropTypes.map.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    query: PropTypes.func.isRequired,
    loadEntry: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  }

  controlID = uuid();
  select = createRef();

  componentDidUpdate(prevProps){
    if(!this.callback) return
    if(
      this.props.queryHits !== prevProps.queryHits &&
      this.props.queryHits.get(this.controlID)
    ){
      const queryHits = this.props.queryHits.get(this.controlID, [])
      return this.callback(queryHits.map(entryMapper))
    }
  }

  handleChange = (value) => this.props.onChange(
    Array.isArray(value) ? List(value.map(getSlug)) : getSlug(value)
  )

  loadOptions = debounce((term, callback) => {
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    this.callback = value => {
      callback(value)
      this.callback = null
    }
    this.props.query(this.controlID, collection, searchFields, term)
  }, 250);

  handleMenuClose = () => {
    this.props.clearSearch();
    this.callback = null;
  };

  formatOptionLabel = (value, {context}) => {
    if(context === 'menu') return value
    if(typeof value === 'string') return {
      slug: value,
      collection: this.props.field.get('collection'),
      loadEntry: this.props.loadEntry,
    }
    return {entry: value}
  }

  shouldComponentUpdate(prevProps){
    const current = this.props.queryHits.get(this.controlID);
    const previous = prevProps.queryHits.get(this.controlID);
    if(current !== previous) return true
    if(prevProps.forID !== this.props.forID) return true
    if(prevProps.classNameWrapper !== this.props.classNameWrapper) return true
    return false
  }

  render() {
    const {forID, classNameWrapper, value} = this.props;
    const {setActiveStyle, setInactiveStyle} = this.props;
    const multiple = !!this.props.field.get('multiple');
    const defaultValue = toJS(value) || multiple ? [] : '';

    return (
      <Wrapper className={classNameWrapper}>
        <Select
          isMulti={multiple}
          innerRef={this.select}
          defaultValue={defaultValue}
          onChange={this.handleChange}
          openMenuOnFocus={false}
          openMenuOnClick={false}
          isClearable={false}
          components={{
            IndicatorSeparator,
            DropdownIndicator,
            Option,
            MultiValueLabel,
            SingleValue,
          }}
          styles={styles}
          cacheOptions={forID}
          onFocus={setActiveStyle}
          onBlur={setInactiveStyle}
          formatOptionLabel={this.formatOptionLabel}
          getOptionValue={getOptionValue}
          onMenuClose={this.handleMenuClose}
          loadOptions={this.loadOptions}
        />
      </Wrapper>
    );
  }
}

