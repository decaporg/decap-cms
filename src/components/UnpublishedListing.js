import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import moment from 'moment';
import { Card } from './UI';
import { Link } from 'react-router';
import { statusDescriptions } from '../constants/publishModes';
import styles from './UnpublishedListing.css';

export default class UnpublishedListing extends React.Component {
  renderColumns(entries, column) {
    if (!entries) return;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <div key={currColumn} className={styles.column}>
          <h2>{statusDescriptions.get(currColumn)}</h2>
          {this.renderColumns(currEntries, currColumn)}
        </div>
      ));
    } else {
      return <div>
        {entries.map(entry => {
          // Look for an "author" field. Fallback to username on backend implementation;
          const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
          const timeStamp = moment(entry.getIn(['metaData', 'timeStamp'])).format('llll');
          const link = `/editorialworkflow/${entry.getIn(['metaData', 'collection'])}/${entry.getIn(['metaData', 'status'])}/${entry.get('slug')}`;
          return (
            <Card key={entry.get('slug')} className={styles.card}>
              <h1><Link to={link}>{entry.getIn(['data', 'title'])}</Link> <small>by {author}</small></h1>
              <p>Last updated: {timeStamp} by {entry.getIn(['metaData', 'user'])}</p>
            </Card>
          );
        }
        )}
      </div>;
    }
  }

  render() {
    const columns = this.renderColumns(this.props.entries);

    return (
      <div>
        <h1>Editorial Workflow</h1>
        {columns}
      </div>
    );
  }
}

UnpublishedListing.propTypes = {
  entries: ImmutablePropTypes.orderedMap,
};
