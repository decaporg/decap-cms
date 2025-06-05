import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { Waypoint } from 'react-waypoint';
import { Map, List } from 'immutable';
import { connect } from 'react-redux';

import { selectUnpublishedEntry, selectUnpublishedEntriesByStatus } from '../../../reducers';
import { selectFields, selectInferredField } from '../../../reducers/collections';
import EntryCard from './EntryCard';

const CardsGrid = styled.ul`
  display: flex;
  flex-flow: row wrap;
  list-style-type: none;
  margin-left: -12px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

class EntryListing extends React.Component {
  static propTypes = {
    collections: ImmutablePropTypes.iterable.isRequired,
    entries: ImmutablePropTypes.list,
    viewStyle: PropTypes.string,
    cursor: PropTypes.any.isRequired,
    handleCursorActions: PropTypes.func.isRequired,
    page: PropTypes.number,
    getUnpublishedEntries: PropTypes.func.isRequired,
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

  getAllEntries = () => {
    const { entries, collections } = this.props;
    const collectionName = Map.isMap(collections) ? collections.get('name') : null;

    if (!collectionName) {
      return entries;
    }

    const unpublishedEntries = this.props.getUnpublishedEntries(collectionName);
    console.log(`Unpublished entries for collection "${collectionName}":`, unpublishedEntries);


    if (!unpublishedEntries || unpublishedEntries.length === 0) {
      return entries;
    }

    const unpublishedList = List(unpublishedEntries.map(entry => entry));

    const publishedSlugs = entries.map(entry => entry.get('slug')).toSet();
    const uniqueUnpublished = unpublishedList.filterNot(entry =>
      publishedSlugs.has(entry.get('slug'))
    );

    return entries.concat(uniqueUnpublished);
  };

  renderCardsForSingleCollection = () => {
    const { collections, viewStyle } = this.props;
    const allEntries = this.getAllEntries();
    const inferredFields = this.inferFields(collections);
    const entryCardProps = { collection: collections, inferredFields, viewStyle };

    return allEntries.map((entry, idx) => {
      const workflowStatus = this.props.getWorkflowStatus(collections.get('name'), entry.get('slug'));
      const isUnpublished = !!workflowStatus;

      return (
        <EntryCard
          {...entryCardProps}
          entry={entry}
          workflowStatus={workflowStatus}
          isUnpublished={isUnpublished}
          key={idx}
        />
      );
    });
  };

  renderCardsForMultipleCollections = () => {
    const { collections, entries } = this.props;
    const isSingleCollectionInList = collections.size === 1;
    return entries.map((entry, idx) => {
      const collectionName = entry.get('collection');
      const collection = collections.find(coll => coll.get('name') === collectionName);
      const collectionLabel = !isSingleCollectionInList && collection.get('label');
      const inferredFields = this.inferFields(collection);
      const workflowStatus = this.props.getWorkflowStatus(collectionName, entry.get('slug'));
      const entryCardProps = {
        collection,
        entry,
        inferredFields,
        collectionLabel,
        workflowStatus
      };
      return <EntryCard {...entryCardProps} key={idx} />;
    });
  };

  render() {
    const { collections, page } = this.props;

    return (
      <div>
        <CardsGrid>
          {Map.isMap(collections)
            ? this.renderCardsForSingleCollection()
            : this.renderCardsForMultipleCollections()}
          {this.hasMore() && <Waypoint key={page} onEnter={this.handleLoadMore} />}
        </CardsGrid>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    getWorkflowStatus: (collectionName, slug) => {
      const unpublishedEntry = selectUnpublishedEntry(state, collectionName, slug);
      return unpublishedEntry ? unpublishedEntry.get('status') : null;
    },
    getUnpublishedEntries: (collectionName) => {
      const allStatuses = ['draft', 'pending_review', 'pending_publish'];
      const unpublishedEntries = [];

      allStatuses.forEach(statusKey => {
        const entriesForStatus = selectUnpublishedEntriesByStatus(state, statusKey);
        console.log(`Unpublished entries for status "${statusKey}":`, entriesForStatus);

        if (entriesForStatus) {
          entriesForStatus.forEach(entry => {
            if (entry.get('collection') === collectionName) {
              const entryWithCollection = entry.set('collection', collectionName);
              unpublishedEntries.push(entryWithCollection);
            }
          });
        }
      });

      return unpublishedEntries;
    }
  };
}

export default connect(mapStateToProps)(EntryListing);
