import React, { PropTypes } from 'react';
import { DragSource, DropTarget, HTML5DragDrop } from 'react-simple-dnd';
import ImmutablePropTypes from 'react-immutable-proptypes';
import moment from 'moment';
import { Card } from './UI';
import { Link } from 'react-router';
import { status, statusDescriptions } from '../constants/publishModes';
import styles from './UnpublishedListing.css';

class UnpublishedListing extends React.Component {
  handleChangeStatus = (newStatus, dragProps) => {
    const slug = dragProps.slug;
    const collection = dragProps.collection;
    const oldStatus = dragProps.ownStatus;
    this.props.handleChangeStatus(collection, slug, oldStatus, newStatus);
  };

  requestPublish = (collection, slug, ownStatus) => {
    if (ownStatus !== status.last()) return;
    if (window.confirm('Are you sure you want to publish this entry?')) {
      this.props.handlePublish(collection, slug, ownStatus);
    }
  };

  renderColumns = (entries, column) => {
    if (!entries) return;

    if (!column) {
      /* eslint-disable */
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <DropTarget key={currColumn} onDrop={this.handleChangeStatus.bind(this, currColumn)}>
          {(isOver) => (
            <div className={isOver ? `${styles.column} ${styles.highlighted}` : styles.column}>
              <h2>{statusDescriptions.get(currColumn)}</h2>
              {this.renderColumns(currEntries, currColumn)}
            </div>
          )}
        </DropTarget>
        /* eslint-enable */
      ));
    } else {
      return (<div>
        {entries.map((entry) => {
          // Look for an "author" field. Fallback to username on backend implementation;
          const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
          const timeStamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('llll');
          const link = `/editorialworkflow/${ entry.getIn(['metaData', 'collection']) }/${ entry.getIn(['metaData', 'status']) }/${ entry.get('slug') }`;
          const slug = entry.get('slug');
          const ownStatus = entry.getIn(['metaData', 'status']);
          const collection = entry.getIn(['metaData', 'collection']);
          return (
            /* eslint-disable */
            <DragSource key={slug} slug={slug} collection={collection} ownStatus={ownStatus}>
              <div className={styles.drag}>
                <Card className={styles.card}>
                  <span className={styles.cardHeading}><Link to={link}>{entry.getIn(['data', 'title'])}</Link> <small>by {author}</small></span>
                  <p className={styles.cardText}>Last updated: {timeStamp} by {entry.getIn(['metaData', 'user'])}</p>
                  {(ownStatus === status.last()) &&
                    <button className={styles.button} onClick={this.requestPublish.bind(this, collection, slug, ownStatus)}>Publish now</button>
                  }
                </Card>
              </div>
            </DragSource>
            /* eslint-enable */
          );
        }
        )}
      </div>);
    }
  };

  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
  };

  render() {
    const columns = this.renderColumns(this.props.entries);
    return (
      <div className={styles.clear}>
        <h1>Editorial Workflow</h1>
        <div className={styles.container}>
          {columns}
        </div>
      </div>
    );
  }
}

export default HTML5DragDrop(UnpublishedListing);
