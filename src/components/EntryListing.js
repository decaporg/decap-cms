import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Map } from 'immutable';
import Bricks from 'bricks.js';
import Waypoint from 'react-waypoint';
import history from '../routing/history';
import Cards from './Cards';
import _ from 'lodash';

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
        { mq: '1515px', columns: 5, gutter: 15 },
        { mq: '1770px', columns: 6, gutter: 15 },
      ],
    };

    this.updateBricks = _.throttle(this.updateBricks.bind(this), 30);
    this.handleLoadMore = this.handleLoadMore.bind(this);
  }

  componentDidMount() {
    this.bricksInstance = Bricks({
      container: this._entries,
      packed: this.bricksConfig.packed,
      sizes: this.bricksConfig.sizes,
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
    const cartType = collection.getIn(['card', 'type']) || 'alltype';
    const card = Cards[cartType] || Cards._unknown;
    return React.createElement(card, {
      key: entry.get('slug'),
      collection,
      onClick: history.push.bind(this, link),
      onImageLoaded: this.updateBricks,
      text: entry.get('label') ? entry.get('label') : entry.getIn(['data', collection.getIn(['card', 'text'])]),
      description: entry.getIn(['data', collection.getIn(['card', 'description'])]),
      image: entry.getIn(['data', collection.getIn(['card', 'image'])]),
    });
  }

  handleLoadMore() {
    this.props.onPaginate(this.props.page + 1);
  }

  renderCards = () => {
    const { collections, entries } = this.props;
    if (Map.isMap(collections)) {
      const collectionName = collections.get('name');
      return entries.map((entry) => {
        const path = `/collections/${ collectionName }/entries/${ entry.get('slug') }`;
        return this.cardFor(collections, entry, path);
      });
    } else {
      return entries.map((entry) => {
        const collection = collections.filter(collection => collection.get('name') === entry.get('collection')).first();
        const path = `/collections/${ collection.get('name') }/entries/${ entry.get('slug') }`;
        return this.cardFor(collection, entry, path);
      });
    }
  };

  render() {
    const { children } = this.props;
    const cards = this.renderCards();
    return (<div>
      <h1>{children}</h1>
      <div ref={c => this._entries = c}>
        {cards}
        <Waypoint onEnter={this.handleLoadMore} />
      </div>
    </div>);
  }
}

EntryListing.propTypes = {
  children: PropTypes.node.isRequired,
  collections: PropTypes.oneOfType([
    ImmutablePropTypes.map,
    ImmutablePropTypes.iterable,
  ]).isRequired,
  entries: ImmutablePropTypes.list,
  onPaginate: PropTypes.func.isRequired,
  page: PropTypes.number,
};
