import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { selectSearchedEntries } from 'Reducers';
import {
  searchEntries as actionSearchEntries,
  clearSearch as actionClearSearch
} from 'Actions/search';
import Entries from './Entries';

class EntriesSearch extends React.Component {
  static propTypes = {
    isFetching: PropTypes.bool,
    searchEntries: PropTypes.func.isRequired,
    clearSearch: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    collections: ImmutablePropTypes.seq,
    entries: ImmutablePropTypes.list,
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

  handleLoadMore = () => {
    const { searchTerm, searchEntries } = this.props;
    searchEntries(searchTerm, true);
  };

  render () {
    const { collections, entries, publicFolder, isFetching } = this.props;
    return (
      <Entries
        collections={collections}
        entries={entries}
        publicFolder={publicFolder}
        onPaginate={this.handleLoadMore}
        isFetching={isFetching}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { searchTerm } = ownProps;
  const collections = ownProps.collections.toIndexedSeq();
  const isFetching = state.entries.getIn(['search', 'isFetching']);
  const entries = selectSearchedEntries(state);
  const publicFolder = state.config.get('public_folder');

  return { isFetching, collections, entries, publicFolder, searchTerm };
}

const mapDispatchToProps = {
  searchEntries: actionSearchEntries,
  clearSearch: actionClearSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(EntriesSearch);
