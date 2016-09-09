import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import dateFormat from 'dateFormat';
import { Card } from './UI';
import { statusDescriptions } from '../constants/publishModes';
import styles from './UnpublishedListing.css';

export default class UnpublishedListing extends React.Component {
  renderColumns(entries, column) {
    if (!entries) return;

    if (!column) {
      return entries.entrySeq().map(([currColumn, currEntries]) => (
        <div key={currColumn} className={styles.column}>
          <h3>{statusDescriptions.get(currColumn)}</h3>
          {this.renderColumns(currEntries, currColumn)}
        </div>
      ));
    } else {
      return <div>
        {entries.map(entry => {
          // Look for an "author" field. Fallback to username on backend implementation;
          const author = entry.getIn(['data', 'author'], entry.getIn(['metaData', 'user']));
          const timeStamp = dateFormat(Date.parse(entry.getIn(['metaData', 'timeStamp'])), 'longDate');
          return (
            <Card key={entry.get('slug')} className={styles.card}>
              <h1>{entry.getIn(['data', 'title'])} <small>by {author}</small></h1>
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
        {columns}
      </div>
    );
  }
}

UnpublishedListing.propTypes = {
  entries: ImmutablePropTypes.orderedMap,
};
