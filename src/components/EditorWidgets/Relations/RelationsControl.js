import React, { Component } from 'react';
import { Loader } from 'UI';
import TagsInput from 'react-tagsinput';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import uuid from 'uuid/v4';
import { Map } from 'immutable';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { query, clearSearch } from 'Actions/search';

class RelationsControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.array,
    field: PropTypes.node,
    isFetching: PropTypes.node,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  constructor(props, ctx) {
    super(props, ctx);
    this.controlID = uuid();
    this.didInitialSearch = false;
  }

  componentDidMount() {
    const { value, field } = this.props;
    if (value) {
      const collection = field.get('collection');
      const searchFields = field.get('searchFields').toJS();
      this.props.query(this.controlID, collection, searchFields, value);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.didInitialSearch) return;
    if (nextProps.queryHits !== this.props.queryHits && nextProps.queryHits.get && nextProps.queryHits.get(this.controlID)) {
      this.didInitialSearch = true;
      const suggestion = nextProps.queryHits.get(this.controlID);
      if (suggestion && suggestion.length === 1) {
        const val = this.getSuggestionValue(suggestion[0]);
        this.props.onChange(val, { [nextProps.field.get('collection')]: { [val]: suggestion[0].data } });
      }
    }
  }

  onChange = (relations) => {
    this.props.onChange(relations.map(val => val));
  };

  onSuggestionsFetchRequested = debounce(({ value }) => {
    if (value.length < 2) return;
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    this.props.query(this.controlID, collection, searchFields, value);
  }, 500);

  onSuggestionsClearRequested = () => {
    this.props.clearSearch();
  };

  getSuggestionValue = (suggestion) => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    return suggestion.data[valueField];
  };

  autocompleteRenderInput = ({ addTag, ...props }) => {
    const handleOnChange = (e, { newValue, method }) => {
      if (method === 'enter') {
        e.preventDefault();
      } else {
        this.onChange(e);
      }
    };

    const inputprops = {
      placeholder: props.placeholder,
      onChange: handleOnChange,
    };

    const suggestions = (this.props.queryHits.get) ? this.props.queryHits.get(this.controlID, []) : [];

    return (
      <div className="nc-relations-container">
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={(e, { suggestion }) => {
            const value = this.getSuggestionValue(suggestion);
            addTag(value);
          }}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={{ ...props, inputprops }}
          focusInputOnSuggestionClick={false}
        />
        <Loader active={this.isFetching === this.controlID} />
      </div>
    );
  };

  renderSuggestion = (suggestion) => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    return <span>{suggestion.data[valueField]}</span>;
  };

  render() {
    // Tags Input Variable Initialization.
    const {
      forID,
      value,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle,
    } = this.props;

    const limit = this.props.field.get("limit", "-1");
    const unique = this.props.field.get("unique", false);
    const inputProps = {
      placeholder: this.props.field.get("placeholder", 'Add a Relation'),
    };

    return (
      <TagsInput
        id={forID}
        className={classNameWrapper}
        value={value || []}
        onChange={this.onChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        maxTags={limit}
        onlyUnique={unique}
        inputProps={inputProps}
        renderInput={this.autocompleteRenderInput}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { className } = ownProps;
  const isFetching = state.search.get('isFetching');
  const queryHits = state.search.get('queryHits');
  return { isFetching, queryHits, className };
}

export default connect(
  mapStateToProps,
  {
    query,
    clearSearch,
  },
  null,
  {
    withRef: true,
  }
)(RelationsControl);
