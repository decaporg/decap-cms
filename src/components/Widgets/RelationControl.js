import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Autosuggest from 'react-autosuggest';
import uuid from 'uuid';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { Loader } from '../../components/UI/index';
import { query, clearSearch } from '../../actions/search';

class RelationControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string.isRequired,
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
    this.state = { displayValue: '' };
  }

  componentDidMount() {
    const { value, field } = this.props;
    if (value) {
      const collection = field.get('collection');
      const searchFields = [ field.get('valueField') ];
      this.props.query(this.controlID, collection, searchFields, value);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.didInitialSearch) return;
    if (
      nextProps.queryHits !== this.props.queryHits &&
      nextProps.queryHits.get && nextProps.queryHits.get(this.controlID)
    ) {
      this.didInitialSearch = true;
      const suggestion = nextProps.queryHits.get(this.controlID);
      if (suggestion && suggestion.length === 1) {
        const displayValue = this.getSuggestionDisplayValue(suggestion[0]);
        this.setState({ displayValue });
      }
    }
  }

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
    this.setState({ displayValue: newValue });
  };

  onSuggestionSelected = (event, { suggestion }) => {
    const value = this.getSuggestionValue(suggestion);
    this.props.onChange(value, { [this.props.field.get('collection')]: { [value]: suggestion.data } });
    const displayValue = this.getSuggestionDisplayValue(suggestion);
    this.setState({ displayValue });
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

  getSuggestionDisplayValue = (suggestion) => {
    const { field } = this.props;
    const displayField = field.get('displayField');
    return suggestion.data[displayField];
  };

  renderSuggestion = (suggestion) => {
    const { field } = this.props;
    const displayField = field.get('displayField');
    return <span>{suggestion.data[displayField]}</span>;
  };

  renderInputComponent = (inputProps) => {
    const { value, displayValue, id, ...otherInputProps } = inputProps;
    return (
      <div>
        <input {...otherInputProps} value={displayValue} />
        <input type="hidden" id={id} value={value} />
      </div>
    );
  };

  render() {
    const { value, isFetching, forID, queryHits } = this.props;

    const inputProps = {
      placeholder: '',
      value: value || '',
      displayValue: this.state.displayValue || '',
      onChange: this.onChange,
      id: forID,
    };

    const suggestions = (queryHits.get) ? queryHits.get(this.controlID, []) : [];

    return (
      <div>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          renderInputComponent={this.renderInputComponent}
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
