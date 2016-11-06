import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { throttle } from 'lodash';
import bricks from 'bricks.js';
import Waypoint from 'react-waypoint';
import history from '../routing/history';
import { selectFields, selectInferedField } from '../reducers/collections';
import { Card } from './UI';
import styles from './EntryListing.css';

export default class EntryListing extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    entries: ImmutablePropTypes.list,
    onPaginate: PropTypes.func.isRequired,
    page: PropTypes.number,
  };

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

    this.updateBricks = throttle(this.updateBricks.bind(this), 30);
    this.handleLoadMore = this.handleLoadMore.bind(this);
  }

  componentDidMount() {
    this.bricksInstance = bricks({
      container: this.containerNode,
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
    if ((prevProps.entries === undefined || prevProps.entries.size === 0)
    && this.props.entries.size === 0) {
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

  handleLoadMore() {
    this.props.onPaginate(this.props.page + 1);
  }

  handleRef = (node) => {
    this.containerNode = node;
  };

  renderCards = () => {
    const { collection, entries } = this.props;
    const collectionName = collection.get('name');
    // Infered Fields
    const titleField = selectInferedField(collection, 'title');
    const descriptionField = selectInferedField(collection, 'description');
    const imageField = selectInferedField(collection, 'image');
    const fields = selectFields(collection);
    const inferedFields = [titleField, descriptionField, imageField];
    const remainingFields = fields.filter(f => inferedFields.indexOf(f.get('name')) === -1);

    return entries.map((entry) => {
      const path = `/collections/${ collectionName }/entries/${ entry.get('slug') }`;
      const image = entry.getIn(['data', imageField]);
      return (
        <Card key={entry.get('slug')} onClick={history.push.bind(this, path)}>
          { image &&
          <header className={styles.cardImage} style={{ backgroundImage: `url(${ image })` }} />
          }
          <h1>{entry.getIn(['data', titleField])}</h1>
          {descriptionField ?
            <p>{entry.getIn(['data', descriptionField])}</p>
            : remainingFields.map(f => (
              <p key={f.get('name')}>
                <strong>{f.get('label')}:</strong> {entry.getIn(['data', f.get('name')])}
              </p>
            ))
          }
        </Card>
      );
    });
  };

  render() {
    const { children } = this.props;
    return (
      <div>
        <h1>{children}</h1>
        <div ref={this.handleRef}>
          { this.renderCards() }
          <Waypoint onEnter={this.handleLoadMore} />
        </div>
      </div>
    );
  }
}
