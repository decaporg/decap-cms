import React, { PropTypes } from 'react';
import { DragSource, DropTarget, HTML5DragDrop } from 'react-simple-dnd';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router';
import moment from 'moment';
import pluralize from 'pluralize';
import { capitalize } from 'lodash'
import { Card, CardTitle, CardText, CardActions } from 'react-toolbox/lib/card';
import Button from 'react-toolbox/lib/button';
import UnpublishedListingCardMeta from './UnpublishedListingCardMeta.js';
import { status, statusDescriptions } from '../../constants/publishModes';
import styles from './UnpublishedListing.css';

class UnpublishedListing extends React.Component {
  static propTypes = {
    entries: ImmutablePropTypes.orderedMap,
    handleChangeStatus: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
  };

  handleChangeStatus = (newStatus, dragProps) => {
    const slug = dragProps.slug;
    const collection = dragProps.collection;
    const oldStatus = dragProps.ownStatus;
    this.props.handleChangeStatus(collection, slug, oldStatus, newStatus);
  };

  requestDelete = (collection, slug, ownStatus) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      this.props.handleDelete(collection, slug, ownStatus);
    }
  };
  requestPublish = (collection, slug, ownStatus) => {
    if (ownStatus !== status.last()) return;
    if (window.confirm('Are you sure you want to publish this entry?')) {
      this.props.handlePublish(collection, slug, ownStatus);
    }
  };

  renderColumns = (entries, column) => {
    if (!entries) return null;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <DropTarget
          key={currColumn}
          /* eslint-disable */
          onDrop={this.handleChangeStatus.bind(this, currColumn)}
          /* eslint-enable */
        >
          {isHovered => (
            <div className={isHovered ? styles.columnHovered : styles.column}>
              <h2 className={styles.columnHeading}>
                {statusDescriptions.get(currColumn)}
              </h2>
              {this.renderColumns(currEntries, currColumn)}
            </div>
          )}
        </DropTarget>
      ));
    }
    return (
      <div>
        {
          entries.map((entry) => {
            // Look for an "author" field. Fallback to username on backend implementation;
            const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
            const timeStamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('llll');
            const link = `collections/${ entry.getIn(['metaData', 'collection']) }/entries/${ entry.get('slug') }`;
            const slug = entry.get('slug');
            const ownStatus = entry.getIn(['metaData', 'status']);
            const collection = entry.getIn(['metaData', 'collection']);
            const isModification = entry.get('isModification');
            return (
              <DragSource
                key={slug}
                slug={slug}
                collection={collection}
                ownStatus={ownStatus}
              >
                <div className={styles.draggable}>
                  <Card className={styles.card}>
                    <UnpublishedListingCardMeta
                      meta={capitalize(pluralize(collection))}
                      label={isModification ? "" : "New"}
                    />
                    <CardTitle
                      title={entry.getIn(['data', 'title'])}
                      subtitle={`by ${ author }`}
                      className={styles.cardTitle}
                    />
                    <CardText>
                      Last updated: {timeStamp} by {entry.getIn(['metaData', 'user'])}
                    </CardText>
                    <CardActions>
                      <Link to={link}>
                        <Button>Edit</Button>
                      </Link>
                      <Button
                      onClick={this.requestDelete.bind(this, collection, slug, ownStatus)}>
                        Delete
                      </Button>
                      {
                        (ownStatus === status.last() && !entry.get('isPersisting', false)) &&
                        <Button
                          accent
                          /* eslint-disable */
                          onClick={this.requestPublish.bind(this, collection, slug, ownStatus)}
                          /* eslint-enable */
                        >
                          Publish now
                        </Button>
                      }
                    </CardActions>
                  </Card>
                </div>
              </DragSource>
            );
          })
        }
      </div>
    );
  };

  render() {
    const columns = this.renderColumns(this.props.entries);
    return (
      <div>
        <h5>Editorial Workflow</h5>
        <div className={styles.container}>
          {columns}
        </div>
      </div>
    );
  }
}

export default HTML5DragDrop(UnpublishedListing); // eslint-disable-line
