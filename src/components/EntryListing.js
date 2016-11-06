import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
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

  handleLoadMore = () => {
    this.props.onPaginate(this.props.page + 1);
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
        <Card key={entry.get('slug')} onClick={history.push.bind(this, path)} className={styles.card}>
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
        <div className={styles.cardsGrid}>
          { this.renderCards() }
          <Waypoint onEnter={this.handleLoadMore} />
        </div>
      </div>
    );
  }
}
