import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import { lengths, components } from 'netlify-cms-ui-default';
import { getNewEntryUrl } from 'Lib/urlHelper';
import Sidebar from './Sidebar';
import CollectionTop from './CollectionTop';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import CollectionControls from './CollectionControls';
import { sortByField } from 'Actions/entries';
import { selectSortableFields } from 'Reducers/collections';
import { selectEntriesSort } from 'Reducers/entries';
import { VIEW_STYLE_LIST } from 'Constants/collectionViews';

const CollectionContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

const CollectionMain = styled.main`
  padding-left: 280px;
`;

const SearchResultContainer = styled.div`
  ${components.cardTop};
  margin-bottom: 22px;
`;

const SearchResultHeading = styled.h1`
  ${components.cardTopHeading};
`;

class Collection extends React.Component {
  static propTypes = {
    searchTerm: PropTypes.string,
    collectionName: PropTypes.string,
    isSearchResults: PropTypes.bool,
    isSingleSearchResult: PropTypes.bool,
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    sortableFields: PropTypes.array,
    sort: ImmutablePropTypes.orderedMap,
    onSortClick: PropTypes.func.isRequired,
  };

  state = {
    viewStyle: VIEW_STYLE_LIST,
  };

  renderEntriesCollection = () => {
    const { collection } = this.props;
    return <EntriesCollection collection={collection} viewStyle={this.state.viewStyle} />;
  };

  renderEntriesSearch = () => {
    const { searchTerm, collections, collection, isSingleSearchResult } = this.props;
    return (
      <EntriesSearch
        collections={isSingleSearchResult ? collections.filter(c => c === collection) : collections}
        searchTerm={searchTerm}
      />
    );
  };

  handleChangeViewStyle = viewStyle => {
    if (this.state.viewStyle !== viewStyle) {
      this.setState({ viewStyle });
    }
  };

  render() {
    const {
      collection,
      collections,
      collectionName,
      isSearchResults,
      isSingleSearchResult,
      searchTerm,
      sortableFields,
      onSortClick,
      sort,
      t,
    } = this.props;
    const newEntryUrl = collection.get('create') ? getNewEntryUrl(collectionName) : '';

    const searchResultKey =
      'collection.collectionTop.searchResults' + (isSingleSearchResult ? 'InCollection' : '');

    return (
      <CollectionContainer>
        <Sidebar
          collections={collections}
          collection={(!isSearchResults || isSingleSearchResult) && collection}
          searchTerm={searchTerm}
        />
        <CollectionMain>
          {isSearchResults ? (
            <SearchResultContainer>
              <SearchResultHeading>
                {t(searchResultKey, { searchTerm, collection: collection.get('label') })}
              </SearchResultHeading>
            </SearchResultContainer>
          ) : (
            <>
              <CollectionTop collection={collection} newEntryUrl={newEntryUrl} />
              <CollectionControls
                collection={collection}
                viewStyle={this.state.viewStyle}
                onChangeViewStyle={this.handleChangeViewStyle}
                sortableFields={sortableFields}
                onSortClick={onSortClick}
                sort={sort}
              />
            </>
          )}
          {isSearchResults ? this.renderEntriesSearch() : this.renderEntriesCollection()}
        </CollectionMain>
      </CollectionContainer>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const { isSearchResults, match, t } = ownProps;
  const { name, searchTerm } = match.params;
  const collection = name ? collections.get(name) : collections.first();
  const sort = selectEntriesSort(state.entries, collection.get('name'));
  const sortableFields = selectSortableFields(collection, t);

  return {
    collection,
    collections,
    collectionName: name,
    isSearchResults,
    searchTerm,
    sort,
    sortableFields,
  };
}

const mapDispatchToProps = {
  sortByField,
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  return {
    ...stateProps,
    ...ownProps,
    onSortClick: (key, direction) =>
      dispatchProps.sortByField(stateProps.collection, key, direction),
  };
};

const ConnectedCollection = connect(mapStateToProps, mapDispatchToProps, mergeProps)(Collection);

export default translate()(ConnectedCollection);
