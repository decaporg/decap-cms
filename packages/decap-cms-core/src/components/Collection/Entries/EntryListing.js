import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { Waypoint } from 'react-waypoint';
import { Map } from 'immutable';

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

  renderCardsForSingleCollection = () => {
    const { collections, entries, viewStyle } = this.props;
    const inferredFields = this.inferFields(collections);
    const entryCardProps = { collection: collections, inferredFields, viewStyle };
    return entries.map((entry, idx) => <EntryCard {...entryCardProps} entry={entry} key={idx} />);
  };

  renderCardsForMultipleCollections = () => {
    const { collections, entries } = this.props;
    const isSingleCollectionInList = collections.size === 1;
    return entries.map((entry, idx) => {
      const collectionName = entry.get('collection');
      const collection = collections.find(coll => coll.get('name') === collectionName);
      const collectionLabel = !isSingleCollectionInList && collection.get('label');
      const inferredFields = this.inferFields(collection);
      const entryCardProps = { collection, entry, inferredFields, collectionLabel };
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
