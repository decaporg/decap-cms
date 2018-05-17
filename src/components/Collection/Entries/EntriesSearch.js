import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { selectSearchedEntries } from 'Reducers';
import {
  searchEntries as actionSearchEntries,
  clearSearch as actionClearSearch
} from 'Actions/search';
import Cursor from 'ValueObjects/Cursor';
import Entries from './Entries';

class EntriesSearch extends React.Component {
  static propTypes = {
    isFetching: PropTypes.bool,
    searchEntries: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    collections: ImmutablePropTypes.seq,
    entries: ImmutablePropTypes.list,
    page: PropTypes.number,
    publicFolder: PropTypes.string,
  };

  componentDidMount() {
    const { searchTerm, searchEntries } = this.props;
    searchEntries(searchTerm);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.searchTerm === nextProps.searchTerm) return;
    const { searchEntries } = this.props;
    searchEntries(nextProps.searchTerm);
  }

  componentWillUnmount() {
    this.props.clearSearch();
  }

  getCursor = () => {
    const { page } = this.props;
    return Cursor.create({
      actions: isNaN(page) ? [] : ["append_next"],
    });
  };

  handleCursorActions = (action) => {
    const { page, searchTerm, searchEntries } = this.props;
    if (action === "append_next") {
      const nextPage = page + 1;
      searchEntries(searchTerm, nextPage);
    }
  };

  render () {
    const { collections, entries, publicFolder, page, isFetching } = this.props;
    return (
      <Entries
        cursor={this.getCursor()}
        handleCursorActions={this.handleCursorActions}
        collections={collections}
        entries={entries}
        publicFolder={publicFolder}
        page={page}
        onPaginate={this.handleLoadMore}
        isFetching={isFetching}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { searchTerm } = ownProps;
  const collections = ownProps.collections.toIndexedSeq();
  const isFetching = state.search.get('isFetching');
  const page = state.search.get('page');
  const entries = selectSearchedEntries(state);
  const publicFolder = state.config.get('public_folder');

  return { isFetching, page, collections, entries, publicFolder, searchTerm };
}

const mapDispatchToProps = {
  searchEntries: actionSearchEntries,
  clearSearch: actionClearSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntriesSearch);
