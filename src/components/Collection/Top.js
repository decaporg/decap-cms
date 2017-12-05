import PropTypes from 'prop-types';
import React from 'react';

const Top = ({ collectionLabel, collectionDescription, newEntryUrl }) => {
  const newEntryLink = (
    <a className="nc-collectionPage-topNewButton" href={newEntryUrl}>{`New ${collectionLabel}`}</a>
  );

  return (
    <div className="nc-collectionPage-top">
      <div className="nc-collectionPage-top-row">
        <h1 className="nc-collectionPage-topHeading">{collectionLabel}</h1>
        { newEntryUrl ? newEntryLink : null }
      </div>
      {
        collectionDescription
          ? <p className="nc-collectionPage-top-description">{collectionDescription}</p>
          : null
      }
    </div>
  );
};

Top.propTypes = {
  collectionLabel: PropTypes.string.isRequired,
  collectionDescription: PropTypes.string,
  newEntryUrl: PropTypes.string
};

export default Top;
