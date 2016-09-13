import React, { PropTypes } from 'react';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import ImmutablePropTypes from 'react-immutable-proptypes';
import moment from 'moment';
import { Card } from './UI';
import { Link } from 'react-router';
import { statusDescriptions } from '../constants/publishModes';
import styles from './UnpublishedListing.css';

const CARD = 'card';

/*
 * Column DropTarget Component
 */
function Column({ connectDropTarget, status, isOver, children }) {
  const className = isOver ? `${styles.column} ${styles.highlighted}` : styles.column;
  return connectDropTarget(
    <div className={className}>
      <h2>{statusDescriptions.get(status)}</h2>
      {children}
    </div>
  );
}

const columnTargetSpec = {
  drop(props, monitor) {
    const slug = monitor.getItem().slug;
    const collection = monitor.getItem().collection;
    const oldStatus = monitor.getItem().currentStatus;
    props.onChangeStatus(collection, slug, oldStatus, props.status);
  }
};

function columnCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  };
}


Column = DropTarget(CARD, columnTargetSpec, columnCollect)(Column);


/*
 * Card  DropTarget Component
 */
function EntryCard({ connectDragSource, children }) {
  return connectDragSource(
    <div>
      <Card className={styles.card}>
        {children}
      </Card>
    </div>
  );
}

const cardDragSpec = {
  beginDrag(props) {
    return {
      slug: props.slug,
      collection: props.collection,
      currentStatus: props.status
    };
  }
};

function cardCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource()
  };
}

EntryCard = DragSource(CARD, cardDragSpec, cardCollect)(EntryCard);

/*
 * The actual exported component implementation
 */
class UnpublishedListing extends React.Component {
  constructor(props) {
    super(props);
    this.renderColumns = this.renderColumns.bind(this);
  }

  renderColumns(entries, column) {
    if (!entries) return;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <Column
            key={currColumn}
            status={currColumn}
            onChangeStatus={this.props.handleChangeStatus}
        >
          {this.renderColumns(currEntries, currColumn)}
        </Column>
      ));
    } else {
      return <div>
        {entries.map(entry => {
          // Look for an "author" field. Fallback to username on backend implementation;
          const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
          const timeStamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('llll');
          const link = `/editorialworkflow/${entry.getIn(['metaData', 'collection'])}/${entry.getIn(['metaData', 'status'])}/${entry.get('slug')}`;
          return (
            <EntryCard
                key={entry.get('slug')}
                slug={entry.get('slug')}
                status={entry.getIn(['metaData', 'status'])}
                collection={entry.getIn(['metaData', 'collection'])}
            >
              <h1><Link to={link}>{entry.getIn(['data', 'title'])}</Link> <small>by {author}</small></h1>
              <p>Last updated: {timeStamp} by {entry.getIn(['metaData', 'user'])}</p>
            </EntryCard>
          );
        }
        )}
      </div>;
    }
  }

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

UnpublishedListing.propTypes = {
  entries: ImmutablePropTypes.orderedMap,
  handleChangeStatus: PropTypes.func.isRequired,
};

export default DragDropContext(HTML5Backend)(UnpublishedListing);
