import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { Waypoint } from 'react-waypoint';
import { Map, List, fromJS } from 'immutable';
import { translate } from 'react-polyglot';
import orderBy from 'lodash/orderBy';
import { colors } from 'decap-cms-ui-default';

import {
  selectFields,
  selectInferredField,
  selectSortDataPath,
} from '../../../reducers/collections';
import { filterNestedEntries } from './EntriesCollection';
import { SortDirection } from '../../../types/redux';
import EntryCard from './EntryCard';

const CardsGrid = styled.ul`
  display: flex;
  flex-flow: row wrap;
  list-style-type: none;
  margin-left: -12px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

const SectionSeparator = styled.div`
  width: 100%;
  margin: 24px 0 16px 12px;
  padding-top: 16px;
  border-top: 2px solid ${colors.textFieldBorder};
`;

const SectionHeading = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textLead};
  margin: 0 0 8px;
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
    getWorkflowStatus: PropTypes.func.isRequired,
    filterTerm: PropTypes.string,
    sortFields: ImmutablePropTypes.list,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(EntryListing.propTypes, this.props, 'prop', 'EntryListing');
  }

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

  sortEntries = (entries, sortFields, collections) => {
    if (!sortFields || sortFields.size === 0) {
      return entries;
    }

    const keys = sortFields.map(v => selectSortDataPath(collections, v.get('key')));
    const orders = sortFields.map(v =>
      v.get('direction') === SortDirection.Ascending ? 'asc' : 'desc',
    );
    return fromJS(orderBy(entries.toJS(), keys.toArray(), orders.toArray()));
  };

  getUnpublishedEntriesList = () => {
    const { entries, collections, filterTerm, sortFields } = this.props;
    const collectionName = Map.isMap(collections) ? collections.get('name') : null;

    if (!collectionName) {
      return List();
    }

    const unpublishedEntries = this.props.getUnpublishedEntries(collectionName);

    if (!unpublishedEntries || unpublishedEntries.length === 0) {
      return List();
    }

    let unpublishedList = List(unpublishedEntries.map(entry => entry));

    if (collections.has('nested') && filterTerm) {
      const collectionFolder = collections.get('folder');
      const subfolders = collections.get('nested').get('subfolders') !== false;

      unpublishedList = filterNestedEntries(
        filterTerm,
        collectionFolder,
        unpublishedList,
        subfolders,
      );
    }

    const publishedSlugs = entries.map(entry => entry.get('slug')).toSet();
    const uniqueUnpublished = unpublishedList.filterNot(entry =>
      publishedSlugs.has(entry.get('slug')),
    );

    return this.sortEntries(uniqueUnpublished, sortFields, collections);
  };

  renderCardsForSingleCollection = () => {
    const { collections, viewStyle, entries, t } = this.props;
    const inferredFields = this.inferFields(collections);
    const entryCardProps = { collection: collections, inferredFields, viewStyle };

    const publishedCards = entries.map((entry, idx) => {
      const workflowStatus = this.props.getWorkflowStatus(
        collections.get('name'),
        entry.get('slug'),
      );

      return (
        <EntryCard
          {...entryCardProps}
          entry={entry}
          workflowStatus={workflowStatus}
          key={`published-${idx}`}
        />
      );
    });

    const unpublishedEntries = this.getUnpublishedEntriesList();

    if (unpublishedEntries.size === 0) {
      return publishedCards;
    }

    const unpublishedCards = unpublishedEntries.map((entry, idx) => {
      const workflowStatus = this.props.getWorkflowStatus(
        collections.get('name'),
        entry.get('slug'),
      );

      return (
        <EntryCard
          {...entryCardProps}
          entry={entry}
          workflowStatus={workflowStatus}
          key={`unpublished-${idx}`}
        />
      );
    });

    return (
      <React.Fragment>
        {publishedCards}
        <SectionSeparator key="separator">
          <SectionHeading>{t('collection.entries.unpublishedHeader')}</SectionHeading>
        </SectionSeparator>
        {unpublishedCards}
      </React.Fragment>
    );
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
        workflowStatus,
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

export default translate()(EntryListing);
