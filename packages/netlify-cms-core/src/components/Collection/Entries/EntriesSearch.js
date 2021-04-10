import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import { Cursor } from 'netlify-cms-lib-util';
import { selectSearchedEntries } from 'Reducers';
import {
  searchEntries as actionSearchEntries,
  clearSearch as actionClearSearch,
} from 'Actions/search';
import Entries from './Entries';

class EntriesSearch extends React.Component {
  static propTypes = {
    isFetching: PropTypes.bool,
    searchEntries: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    collections: ImmutablePropTypes.seq,
    collectionNames: PropTypes.array,
    entries: ImmutablePropTypes.list,
    page: PropTypes.number,
  };

  componentDidMount() {
    const { searchTerm, searchEntries, collectionNames } = this.props;
    searchEntries(searchTerm, collectionNames);
  }

  componentDidUpdate(prevProps) {
    const { searchTerm, collectionNames } = this.props;

    // check if the search parameters are the same
    if (prevProps.searchTerm === searchTerm && isEqual(prevProps.collectionNames, collectionNames))
      return;

    const { searchEntries } = prevProps;
    searchEntries(searchTerm, collectionNames);
  }

  componentWillUnmount() {
    this.props.clearSearch();
  }

  getCursor = () => {
    const { page } = this.props;
    return Cursor.create({
      actions: isNaN(page) ? [] : ['append_next'],
    });
  };

  handleCursorActions = action => {
    const { page, searchTerm, searchEntries, collectionNames } = this.props;
    if (action === 'append_next') {
      const nextPage = page + 1;
      searchEntries(searchTerm, collectionNames, nextPage);
    }
  };

  render() {
    const { collections, entries, isFetching } = this.props;
    return (
      <Entries
        cursor={this.getCursor()}
        handleCursorActions={this.handleCursorActions}
        collections={collections}
        entries={entries}
        isFetching={isFetching}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { searchTerm } = ownProps;
  const collections = ownProps.collections.toIndexedSeq();
  const collectionNames = ownProps.collections.keySeq().toArray();
  const isFetching = state.search.isFetching;
  const page = state.search.page;
  const entries = selectSearchedEntries(state, collectionNames);
  return { isFetching, page, collections, collectionNames, entries, searchTerm };
}

const mapDispatchToProps = {
  searchEntries: actionSearchEntries,
  clearSearch: actionClearSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntriesSearch);
