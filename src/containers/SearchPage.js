import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { selectSearchedEntries } from '../reducers';
import { searchEntries } from '../actions/entries';
import { Loader } from '../components/UI';
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

  render() {
    const { searchTerm, entries } = this.props;
    return <div className={styles.root}>
      <h1>Search for {searchTerm}</h1>
      {entries ?
        entries.map(entry => entry.get('title'))
        :
        <Loader active>{['Loading Entries', 'Caching Entries', 'This might take several minutes']}</Loader>
      }
    </div>;
  }
}


function mapStateToProps(state, ownProps) {
  const page = state.entries.getIn(['search', 'page']);
  const entries = selectSearchedEntries(state);

  const searchTerm = ownProps.params && ownProps.params.searchTerm;

  return { page, entries, searchTerm };
}


export default connect(
  mapStateToProps,
  { searchEntries }
)(SearchPage);
