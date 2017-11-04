import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { getNewEntryUrl } from '../lib/urlHelper';
import Sidebar from './Sidebar';
import Top from './Top';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';

class Collection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
  };

  renderEntriesCollection = () => {
    const { name, collection } = this.props;
    return <EntriesCollection collection={collection} name={name} />
  };

  renderEntriesSearch = () => {
    const { searchTerm, collections } = this.props;
    return <EntriesSearch collections={collections} searchTerm={searchTerm} />
  };

  render() {
    const { collection, collections, collectionName, isSearchResults, searchTerm } = this.props;
    const newEntryUrl = collection.get('create') && getNewEntryUrl(collectionName, true);
    return (
      <div className="nc-collectionPage-container">
        <Sidebar collections={collections} searchTerm={searchTerm}/>
        <div className="nc-collectionPage-main">
          {
            isSearchResults
              ? null
              : <Top collectionLabel={collection.get('label')} newEntryUrl={newEntryUrl}/>
          }
          { isSearchResults ? this.renderEntriesSearch() : this.renderEntriesCollection() }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const { isSearchResults, match } = ownProps;
  const { name, searchTerm } = match.params;
  const collection = name ? collections.get(name) : collections.first();
  return { collection, collections, collectionName: name, isSearchResults, searchTerm };
}

export default connect(mapStateToProps)(Collection);
