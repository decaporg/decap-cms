import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { selectSearchedEntries } from '../reducers';
import { searchEntries } from '../actions/entries';
import { Loader } from '../components/UI';
import EntryListing from '../components/EntryListing';
import styles from './breakpoints.css';

class SearchPage extends React.Component {

  static propTypes = {
    isFetching: PropTypes.bool,
    searchEntries: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    entries: ImmutablePropTypes.list,
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

  handleLoadMore = (page) => {
    const { searchTerm, searchEntries } = this.props;
    searchEntries(searchTerm, page);
  };

  render() {
    const { collections, searchTerm, entries, isFetching, page } = this.props;
    return (<div className={styles.root}>
      {(isFetching === true || !entries) ?
        <Loader active>{['Loading Entries', 'Caching Entries', 'This might take several minutes']}</Loader>
        :
          <EntryListing collections={collections} entries={entries} page={page} onPaginate={this.handleLoadMore}>
          Results for “                   {searchTerm}”
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
  const searchTerm = ownProps.params && ownProps.params.searchTerm;

  return { isFetching, page, collections, entries, searchTerm };
}


export default connect(
  mapStateToProps,
  { searchEntries }
)(SearchPage);
