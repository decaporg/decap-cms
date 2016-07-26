import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Bricks from 'bricks.js';
import history from '../routing/history';
import Cards from './Cards';
import _ from 'lodash';
import styles from './EntryListing.css'

export default class EntryListing extends React.Component {
  constructor(props) {
    super(props);
    this.bricksInstance = null;

    this.bricksConfig = {
      packed: 'data-packed',
      sizes: [
        { columns: 1, gutter: 15 },
        { mq: '495px', columns: 2, gutter: 15 },
        { mq: '750px', columns: 3, gutter: 15 },
        { mq: '1005px', columns: 4, gutter: 15 },
        { mq: '1260px', columns: 5, gutter: 15 },
        { mq: '1515px', columns: 6, gutter: 15 },
        { mq: '1770px', columns: 7, gutter: 15 },
      ]
    };

    this.updateBricks = _.throttle(this.updateBricks.bind(this), 30);
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

  updateBricks() {
    this.bricksInstance.pack();
  }

  cardFor(collection, entry, link) {
    //const { entry, getMedia, onChange, onAddMedia, onRemoveMedia } = this.props;
    const card = Cards[collection.getIn(['card', 'type'])] || Cards._unknown;
    return React.createElement(card, {
      key: entry.get('slug'),
      collection: collection,
      onClick: history.push.bind(this, link),
      onImageLoaded: this.updateBricks,
      text: entry.getIn(['data', collection.getIn(['card', 'text'])]),
      description: entry.getIn(['data', collection.getIn(['card', 'description'])]),
      image: entry.getIn(['data', collection.getIn(['card', 'image'])]),
    });
  }

  render() {
    const { collection, entries } = this.props;
    const name = collection.get('name');

    return <div className={styles.root}>
      <h1>Listing {name}</h1>
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
