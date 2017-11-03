import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import c from 'classnames';
import history from '../../routing/history';
import { resolvePath } from '../../lib/pathHelper';

const EntryCard = ({ collection, entry, inferedFields, publicFolder }) => {
  const path = `/collections/${ collection.get('name') }/entries/${ entry.get('slug') }`;
  const label = entry.get('label');
  const title = label || entry.getIn(['data', inferedFields.titleField]);
  let image = entry.getIn(['data', inferedFields.imageField]);
  image = resolvePath(image, publicFolder);
  if(image) {
    image = encodeURI(image);
  }

  return (
    <div
      key={entry.get('slug')}
      onClick={() => history.push(path)}
      className="nc-entryListing-card"
    >
      { image &&
      <header className="nc-entryListing-cardImage" style={{ backgroundImage: `url(${ image })` }} />
      }
      <div className={c('nc-entryListing-cardBody', { 'nc-entryListing-cardBody-full': !image })}>
        <h2 className="nc-entryListing-cardHeading">{title}</h2>
        {inferedFields.descriptionField ?
          <p>{entry.getIn(['data', inferedFields.descriptionField])}</p>
          : inferedFields.remainingFields && inferedFields.remainingFields.map(f => (
            <p key={f.get('name')} className="nc-entryListing-cardList">
              <span className="nc-entryListing-cardListLabel">{f.get('label')}:</span>{' '}
              { (entry.getIn(['data', f.get('name')]) || '').toString() }
            </p>
          ))
        }
      </div>
    </div>
  );
}

export default EntryCard;
