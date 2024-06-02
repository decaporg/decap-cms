import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Waypoint } from 'react-waypoint';
import { Map } from 'immutable';

import { selectFields, selectInferredField } from '../../../reducers/collections';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from '../../../constants/collectionViews';
import EntryListingGrid from './EntryListingGrid';
import EntryListingTable from './EntryListingTable';

export default class EntryListing extends React.Component {
  static propTypes = {
    collections: ImmutablePropTypes.iterable.isRequired,
    entries: ImmutablePropTypes.list,
    viewStyle: PropTypes.string,
    cursor: PropTypes.any.isRequired,
    handleCursorActions: PropTypes.func.isRequired,
    page: PropTypes.number,
  };

  hasMore = () => {
    const hasMore = this.props.cursor?.actions?.has('append_next');
    return hasMore;
  };

  handleLoadMore = () => {
    if (this.hasMore()) {
      this.props.handleCursorActions('append_next');
    }
  };

  inferFields = collection => {
    const titleField = selectInferredField(collection, 'title');
    const descriptionField = selectInferredField(collection, 'description');
    const imageField = selectInferredField(collection, 'image');
    const fields = selectFields(collection);
    const inferredFields = [titleField, descriptionField, imageField];
    const remainingFields =
      fields && fields.filter(f => inferredFields.indexOf(f.get('name')) === -1);
    return { titleField, descriptionField, imageField, remainingFields };
  };

  renderEntriesForSingleCollection = () => {
    const { collections, entries, viewStyle } = this.props;
    const inferredFields = this.inferFields(collections);

    const entriesData = entries.map(entry => {
      return {
        ...entry.toJS(),
        descriptionFieldName: inferredFields.descriptionField,
        imageFieldName: inferredFields.imageField,
        titleFieldName: inferredFields.titleField,
      };
    });

    if (viewStyle === VIEW_STYLE_LIST) {
      return <EntryListingTable entries={entriesData} />;
    }

    if (viewStyle === VIEW_STYLE_GRID) {
      return <EntryListingGrid entries={entriesData} />;
    }
  };

  renderEntriesForMultipleCollections = () => {
    const { collections, entries, viewStyle } = this.props;
    const isSingleCollectionInList = collections.size === 1;
    let entriesData;

    if (isSingleCollectionInList) {
      entriesData = entries.map(entry => {
        const inferredFields = this.inferFields(collections.first());

        return {
          ...entry.toJS(),
          descriptionFieldName: inferredFields.descriptionField,
          imageFieldName: inferredFields.imageField,
          titleFieldName: inferredFields.titleField,
        };
      });
    } else {
      entriesData = entries.map(entry => {
        const collectionName = entry.get('collection');
        const collection = collections.find(c => c.get('name') === collectionName);
        const collectionLabel = collection.get('label_singular') || collection.get('label');

        const inferredFields = this.inferFields(collection);

        return {
          collection,
          ...entry.toJS(),
          descriptionFieldName: inferredFields.descriptionField,
          imageFieldName: inferredFields.imageField,
          titleFieldName: inferredFields.titleField,
          collectionLabel,
        };
      });
    }

    if (viewStyle === VIEW_STYLE_LIST) {
      return (
        <EntryListingTable
          entries={entriesData}
          isSingleCollectionInList={isSingleCollectionInList}
        />
      );
    }

    if (viewStyle === VIEW_STYLE_GRID) {
      return (
        <EntryListingGrid
          entries={entriesData}
          isSingleCollectionInList={isSingleCollectionInList}
        />
      );
    }
  };

  render() {
    const { collections, page } = this.props;

    return (
      <>
        {Map.isMap(collections)
          ? this.renderEntriesForSingleCollection()
          : this.renderEntriesForMultipleCollections()}
        {this.hasMore() && <Waypoint key={page} onEnter={this.handleLoadMore} />}
      </>
    );
  }
}
