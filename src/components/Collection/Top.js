import PropTypes from 'prop-types';
import React from 'react';

const Top = ({ collectionLabel, newEntryUrl }) => {
  const newEntryLink = (
    <a className="nc-collectionPage-topNewButton" href={newEntryUrl}>{`New ${collectionLabel}`}</a>
  );

  return (
    <div className="nc-collectionPage-top">
      <h1 className="nc-collectionPage-topHeading">{collectionLabel}</h1>
      { newEntryUrl ? newEntryLink : null }
    </div>
  );
};

Top.propTypes = {
  collectionLabel: PropTypes.string.isRequired,
  newEntryUrl: PropTypes.string
};

export default Top;
