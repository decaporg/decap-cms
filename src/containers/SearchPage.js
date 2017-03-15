import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { selectSearchedEntries } from '../reducers';
import { searchEntries as actionSearchEntries, clearSearch as actionClearSearch } from '../actions/search';
import { Loader } from '../components/UI';
import EntryListing from '../components/EntryListing/EntryListing';

class SearchPage extends React.Component {

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

  handleLoadMore = (page) => {
    const { searchTerm, searchEntries } = this.props;
    if (!isNaN(page)) searchEntries(searchTerm, page);
  };

  render() {
    const { collections, searchTerm, entries, isFetching, page, publicFolder } = this.props;
    return (<div>
      {(isFetching === true || !entries) ?
        <Loader active>{['Loading Entries', 'Caching Entries', 'This might take several minutes']}</Loader>
        :
        <EntryListing
          collections={collections}
          entries={entries}
          page={page}
          publicFolder={publicFolder}
          onPaginate={this.handleLoadMore}
        >
            Results for “{searchTerm}”
          </EntryListing>
      }
    </div>);
  }
}


function mapStateToProps(state, ownProps) {
  const isFetching = state.entries.getIn(['search', 'isFetching']);
  const page = state.entries.getIn(['search', 'page']);
  const entries = selectSearchedEntries(state);
  const collections = state.collections.toIndexedSeq();
  const publicFolder = state.config.get('public_folder');
  const searchTerm = ownProps.params && ownProps.params.searchTerm;

  return { isFetching, page, collections, entries, publicFolder, searchTerm };
}


export default connect(
  mapStateToProps,
  {
    searchEntries: actionSearchEntries,
    clearSearch: actionClearSearch,
  }
)(SearchPage);
