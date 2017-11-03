import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
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
    const { collection, collections, isSearchResults, searchTerm } = this.props;
    return (
      <div className="nc-collectionPage-container">
        <Sidebar collections={collections} searchTerm={searchTerm}/>
        { isSearchResults ? null : <Top collectionName={collection.get('label')}/> }
        { isSearchResults ? this.renderEntriesSearch() : this.renderEntriesCollection() }
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const { isSearchResults, match } = ownProps;
  const { name, searchTerm } = match.params;
  const collection = name ? collections.get(name) : collections.first();
  return { collection, collections, isSearchResults, searchTerm };
}

export default connect(mapStateToProps)(Collection);
