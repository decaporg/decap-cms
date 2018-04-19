import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Waypoint from 'react-waypoint';
import { Map } from 'immutable';
import { selectFields, selectInferedField } from 'Reducers/collections';
import EntryCard from './EntryCard';

export default class EntryListing extends React.Component {
  static propTypes = {
    publicFolder: PropTypes.string.isRequired,
    collections: PropTypes.oneOfType([
      ImmutablePropTypes.map,
      ImmutablePropTypes.iterable,
    ]).isRequired,
    entries: ImmutablePropTypes.list,
    onPaginate: PropTypes.func.isRequired,
    page: PropTypes.number,
    viewStyle: PropTypes.string,
  };

  handleLoadMore = () => {
    this.props.onPaginate(this.props.page + 1);
  };

  inferFields = collection => {
    const titleField = selectInferedField(collection, 'title');
    const descriptionField = selectInferedField(collection, 'description');
    const imageField = selectInferedField(collection, 'image');
    const fields = selectFields(collection);
    const inferedFields = [titleField, descriptionField, imageField];
    const remainingFields = fields && fields.filter(f => inferedFields.indexOf(f.get('name')) === -1);
    return { titleField, descriptionField, imageField, remainingFields };
  };

  renderCardsForSingleCollection = () => {
    const { collections, entries, publicFolder, viewStyle } = this.props;
    const inferedFields = this.inferFields(collections);
    const entryCardProps = { collection: collections, inferedFields, publicFolder, viewStyle };
    return entries.map((entry, idx) => <EntryCard {...{ ...entryCardProps, entry, key: idx }} />);
  };

  renderCardsForMultipleCollections = () => {
    const { collections, entries, publicFolder } = this.props;
    return entries.map((entry, idx) => {
      const collectionName = entry.get('collection');
      const collection = collections.find(coll => coll.get('name') === collectionName);
      const collectionLabel = collection.get('label');
      const inferedFields = this.inferFields(collection);
      const entryCardProps = { collection, entry, inferedFields, publicFolder, key: idx, collectionLabel };
      return <EntryCard {...entryCardProps}/>;
    });
  };

  render() {
    const { collections, entries, publicFolder, cursorActions, cursorMeta } = this.props;
    const { first, next, last, prev } = (cursorActions || {});
    const { index: rawIndex, pageCount: rawPageCount } = (cursorMeta || {});
    const index = rawIndex + 1;
    const pageCount = rawPageCount + 1;
    const pageString = index
      ? `Page ${ index }${ pageCount ? ` of ${ pageCount }` : "" }`
      : "";

    return (
      <div>
        <div className="nc-entryListing-cardsGrid">
          {
            Map.isMap(collections)
              ? this.renderCardsForSingleCollection()
              : this.renderCardsForMultipleCollections()
          }
          {cursorActions && Object.keys(cursorActions).length > 0
            ? <div className="nc-entryListing-pagination">
              <div className="nc-entryListing-paginationElement">
                {first ? <button className="nc-entryListing-paginationButton" onClick={first}>{"<<<"}</button> : ""}
              </div>
              <div className="nc-entryListing-paginationElement">
                {prev ? <button className="nc-entryListing-paginationButton" onClick={prev}>{"<"}</button> : ""}
              </div>
              <div className="nc-entryListing-paginationElement nc-entryListing-paginationMeta">
                {pageString}
              </div>
              <div className="nc-entryListing-paginationElement nc-entryListing-paginationElementRight">
                {next ? <button className="nc-entryListing-paginationButton" onClick={next}>{">"}</button> : ""}
              </div>
              <div className="nc-entryListing-paginationElement nc-entryListing-paginationElementRight">
                {last ? <button className="nc-entryListing-paginationButton" onClick={last}>{">>>"}</button> : ""}
              </div>
            </div>
           : ""}
          </div>
      </div>
    );
  }
}
