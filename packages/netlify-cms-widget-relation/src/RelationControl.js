import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'react-emotion';
import Autosuggest from 'react-autosuggest';
import uuid from 'uuid/v4';
import { List, Map } from 'immutable';
import { debounce } from 'lodash';
import { Loader, components } from 'netlify-cms-ui-default';

/**
 * Create a classname for use as a descendant selector. This is generally
 * discouraged in Emotion because composition will break the resulting
 * classnames, but we won't be using composition here.
 */
const styles = {
  suggestionsContainer: css`
    display: none;
  `,
};

/**
 * react-autosuggest theme spec:
 * https://github.com/moroshko/react-autosuggest#theme-optional
 */
const theme = {
  container: css`
    position: relative;
  `,
  containerOpen: css`
    ${styles.suggestionsContainer} {
      ${components.dropdownList}
      position: absolute;
      display: block;
      top: 51px;
      width: 100%;
      z-index: 2;
    }
  `,
  suggestion: css`
    ${components.drodpownItem};
    cursor: pointer;
    padding: 10px 20px;
  `,
  suggestionsList: css`
    margin: 0;
    padding: 0;
    list-style-type: none;
  `,
  suggestionHighlighted: css`
    background-color: #ddd;
  `,
};

function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default class RelationControl extends React.Component {
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
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
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
    console.log(`receiving`);
    console.log(nextProps.queryHits && nextProps.queryHits.get(this.controlID));
    if (this.didInitialSearch) return;
    if (nextProps.queryHits !== this.props.queryHits && nextProps.queryHits.get && nextProps.queryHits.get(this.controlID)) {
      this.didInitialSearch = true;
      const suggestion = nextProps.queryHits.get(this.controlID);
      if (suggestion && suggestion.length === 1) {
        const val = this.getSuggestionValue(suggestion[0]);
        console.log(`accepting ${val}`);
        this.props.onChange(val, { [nextProps.field.get('collection')]: { [val]: suggestion[0].data } });
      }
    }
  }

  onChange = (event, { newValue }) => {
    this.props.onChange(newValue);
  };

  onSuggestionSelected = (event, { suggestion }) => {
    const value = this.getSuggestionValue(suggestion);
    this.props.onChange(value, { [this.props.field.get('collection')]: { [value]: suggestion.data } });
  };

  onSuggestionsFetchRequested = debounce(({ value }) => {
    if (value.length < 2) return;
    const { field } = this.props;
    const collection = field.get('collection');
    const searchFields = field.get('searchFields').toJS();
    console.log(`querying ${value}`);
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

  renderSuggestion = (suggestion) => {
    const { field } = this.props;
    const valueField = field.get('displayFields') || field.get('valueField');
    if (List.isList(valueField)) {
      return (
        <span>
          {valueField.toJS().map(key => <span key={key}>{new String(suggestion.data[key])}{' '}</span>)}
        </span>
      );
    }
    return <span>{new String(suggestion.data[valueField])}</span>;
  };

  render() {
    const {
      value,
      isFetching,
      forID,
      queryHits,
      classNameWrapper,
      setActiveStyle,
      setInactiveStyle
    } = this.props;

    const inputProps = {
      placeholder: '',
      value: value || '',
      onChange: this.onChange,
      id: forID,
      className: classNameWrapper,
      onFocus: setActiveStyle,
      onBlur: setInactiveStyle,
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
          inputProps={inputProps}
          focusInputOnSuggestionClick={false}
          theme={theme}
        />
        <Loader active={isFetching === this.controlID} />
      </div>
    );
  }
};
