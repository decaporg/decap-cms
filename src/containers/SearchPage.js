import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { selectSearchedEntries } from '../reducers';
import { searchEntries } from '../actions/entries';
import { Loader } from '../components/UI';
import EntryListing from '../components/EntryListing';
import styles from './CollectionPage.css';

class SearchPage extends React.Component {

  static propTypes = {
    searchEntries: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    entries: ImmutablePropTypes.list
  };

  componentDidMount() {
    const { searchTerm, searchEntries } = this.props;
    searchEntries(searchTerm);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.route === nextProps.route) return;
    const { searchEntries } = this.props;
    searchEntries(nextProps.route.searchTerm);
  }

  handleLoadMore() {
  }

  render() {
    const { collections, searchTerm, entries, page } = this.props;
    return <div className={styles.root}>
      <h1>Search for {searchTerm}</h1>
      {entries ?
        <EntryListing collections={collections} entries={entries} page={page} onPaginate={this.handleLoadMore}>
          Results for “{searchTerm}”
        </EntryListing>
        :
        <Loader active>{['Loading Entries', 'Caching Entries', 'This might take several minutes']}</Loader>
      }
    </div>;
  }
}


function mapStateToProps(state, ownProps) {
  const page = state.entries.getIn(['search', 'page']);
  const entries = selectSearchedEntries(state);
  const collections = state.collections.toIndexedSeq();
  const searchTerm = ownProps.params && ownProps.params.searchTerm;

  return { page, collections, entries, searchTerm };
}


export default connect(
  mapStateToProps,
  { searchEntries }
)(SearchPage);
