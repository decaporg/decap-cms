import React, { Component, PropTypes } from 'react';
import Autosuggest from 'react-autosuggest';
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
    isFetching: PropTypes.bool,
    query: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    queryHits: PropTypes.array, // eslint-disable-line
  };

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
  };

  onSuggestionSelected = (event, { suggestion }) => {
    this.props.onChange(this.getSuggestionValue(suggestion), suggestion.data);
  };

  onSuggestionsFetchRequested = debounce(({ value }) => {
    if (value.length < 3) return;
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').map(f => `data.${ f }`).toJS();
    this.props.query(collection, searchFields, value);
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

    return queryHits.filter((hit) => {
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

    return (
      <div>
        <Autosuggest
          suggestions={queryHits}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={inputProps}
        />
        <Loader active={isFetching} />
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
