import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Bricks from 'bricks.js'
import { browserHistory } from 'react-router';
import Cards from './Cards';

export default class EntryListing extends React.Component {
  constructor(props) {
    super(props);
    this.bricksInstance = null;

    this.bricksConfig = {
      packed: 'data-packed',
      sizes: [
        { columns: 2, gutter: 15 },
        { mq: '780px', columns: 3, gutter: 15 },
        { mq: '1035px', columns: 4, gutter: 15 },
        { mq: '1290px', columns: 5, gutter: 15 },
        { mq: '1545px', columns: 6, gutter: 15 },
        { mq: '1800px', columns: 7, gutter: 15 },
      ]
    };
  }

  componentDidMount() {
    this.bricksInstance = Bricks({
      container: this._entries,
      packed: this.bricksConfig.packed,
      sizes: this.bricksConfig.sizes
    });

    this.bricksInstance.resize(true);

    if (this.props.entries && this.props.entries.size > 0) {
      setTimeout(() => {
        this.bricksInstance.pack();
      }, 0);
    }
  }

  componentDidUpdate(prevProps) {
    if ((prevProps.entries === undefined || prevProps.entries.size === 0) && this.props.entries.size === 0) {
      return;
    }

    this.bricksInstance.pack();
  }

  componengWillUnmount() {
    this.bricksInstance.resize(false);
  }

  cardFor(collection, entry, link) {
    //const { entry, getMedia, onChange, onAddMedia, onRemoveMedia } = this.props;
    const card = Cards[collection.getIn(['card', 'type'])] || Cards._unknown;
    return React.createElement(card, {
      key: entry.get('slug'),
      collection: collection,
      onClick: browserHistory.push.bind(this, link),
      text: entry.getIn(['data', collection.getIn(['card', 'text'])]),
      image: entry.getIn(['data', collection.getIn(['card', 'image'])]),
    });
  }

  render() {
    const { collection, entries } = this.props;
    const name = collection.get('name');

    return <div>
      <h2>Listing {name}</h2>
      <div ref={(c) => this._entries = c}>
        {entries.map((entry) => {
          const path = `/collections/${name}/entries/${entry.get('slug')}`;
          return this.cardFor(collection, entry, path);
        })}
      </div>
    </div>;
  }
}

EntryListing.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entries: ImmutablePropTypes.list,
};
