import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Card } from './UI';
import { statusDescriptions } from '../constants/publishModes';

export default class UnpublishedListing extends React.Component {
  renderColumn(entries) {
    if (!entries) return;
    return (
      <div>
        {entries.map(entry => {
          return <Card key={entry.get('slug')}><h4>{entry.getIn(['data', 'title'])}</h4></Card>;
        }
        )}
      </div>
    );
  }

  render() {
    const { entries } = this.props;
    const columns = entries.entrySeq().map(([key, currEntries]) => (
      <div key={key}>
        <h3>{statusDescriptions.get(key)}</h3>
        {this.renderColumn(currEntries)}
      </div>
    ));

    return (
      <div>
        {columns}
      </div>
    );
  }
}

UnpublishedListing.propTypes = {
  entries: ImmutablePropTypes.map,
};



<div>
  <h3>Drafts</h3>
  <card>Cool Recipe</card>
</div>
