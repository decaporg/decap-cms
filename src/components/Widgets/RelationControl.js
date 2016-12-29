import React, { Component, PropTypes } from 'react';
import Autosuggest from 'react-autosuggest';
import uuid from 'uuid';
import { Map } from 'immutable';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { Loader } from '../../components/UI/index';
import { query, clearSearch } from '../../actions/search';


function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class RelationControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
    isFetching: PropTypes.node,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
  };

  constructor(props, ctx) {
    super(props, ctx);
    this.controlID = uuid.v4();
    this.didInitialSearch = false;
  }

  componentDidMount() {
    const { value, field } = this.props;
    if (value) {
      const collection = field.get('collection');
      const searchFields = field.get('searchFields').map(f => `data.${ f }`).toJS();
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
        this.props.onChange(val, Map({ [val]: suggestion[0].data }));
      }
    }
  }

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
  };

  onSuggestionSelected = (event, { suggestion }) => {
    const value = this.getSuggestionValue(suggestion);
    this.props.onChange(value, Map({ [value]: suggestion.data }));
  };

  onSuggestionsFetchRequested = debounce(({ value }) => {
    if (value.length < 2) return;
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').map(f => `data.${ f }`).toJS();
    this.props.query(this.controlID, collection, searchFields, value);
  }, 80);

  onSuggestionsClearRequested = () => {
    this.props.clearSearch();
  };

  getMatchingHits = (value) => {
    const { field, queryHits } = this.props;
    const searchFields = field.get('searchFields').toJS();
    const escapedValue = escapeRegexCharacters(value.trim());
    const regex = new RegExp(`^ ${ escapedValue }`, 'i');

    if (escapedValue === '') {
      return [];
    }
    return queryHits.get(this.controlID).filter((hit) => {
      let testResult = false;
      searchFields.forEach((f) => {
        testResult = testResult || regex.test(hit.data[f]);
      });
      return testResult;
    });
  };

  getSuggestionValue = (suggestion) => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    return suggestion.data[valueField];
  };

  renderSuggestion = (suggestion) => {
    const { field } = this.props;
    const valueField = field.get('valueField');
    return <span>{suggestion.data[valueField]}</span>;
  };

  render() {
    const { value, isFetching, queryHits } = this.props;

    const inputProps = {
      placeholder: '',
      value: value || '',
      onChange: this.onChange,
    };

    const suggestions = (queryHits.get) ? queryHits.get(this.controlID, []) : [];
    console.log(this.controlID, suggestions);

    return (
      <div>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={inputProps}
        />
        <Loader active={isFetching === this.controlID} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const isFetching = state.search.get('isFetching');
  const queryHits = state.search.get('queryHits');
  return { isFetching, queryHits };
}

export default connect(
  mapStateToProps,
  {
    query,
    clearSearch,
  }
)(RelationControl);
