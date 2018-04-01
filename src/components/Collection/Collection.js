import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { getNewEntryUrl } from 'Lib/urlHelper';
import Sidebar from './Sidebar';
import CollectionTop from './CollectionTop';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';

class Collection extends React.Component {
  static propTypes = {
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
  };

  state = {
    viewStyle: VIEW_STYLE_LIST,
  };

  renderEntriesCollection = () => {
    const { name, collection } = this.props;
    return <EntriesCollection collection={collection} name={name} viewStyle={this.state.viewStyle}/>
  };

  renderEntriesSearch = () => {
    const { searchTerm, collections } = this.props;
    return <EntriesSearch collections={collections} searchTerm={searchTerm} />
  };

  handleChangeViewStyle = (viewStyle) => {
    if (this.state.viewStyle !== viewStyle) {
      this.setState({ viewStyle });
    }
  }

  render() {
    const { collection, collections, collectionName, isSearchResults, searchTerm } = this.props;
    const newEntryUrl = collection.get('create') ? getNewEntryUrl(collectionName) : '';
    return (
      <div className="nc-collectionPage-container">
        <Sidebar collections={collections} searchTerm={searchTerm}/>
        <div className="nc-collectionPage-main">
          {
            isSearchResults
              ? null
              : <CollectionTop
                  collectionLabel={collection.get('label')}
                  collectionLabelSingular={collection.get('label_singular')}
                  collectionDescription={collection.get('description')}
                  newEntryUrl={newEntryUrl}
                  viewStyle={this.state.viewStyle}
                  onChangeViewStyle={this.handleChangeViewStyle}
                />
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
