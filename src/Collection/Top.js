import PropTypes from 'prop-types';
import React from 'react';

const Top = ({ collectionName }) =>
  <div className="nc-collectionPage-top">
    <h1 className="nc-collectionPage-topHeading">{collectionName}</h1>
    <button className="nc-collectionPage-topNewButton">{`New ${collectionName}`}</button>
  </div>;

Top.propTypes = {
  collectionName: PropTypes.string.isRequired,
};

export default Top;
