import PropTypes from 'prop-types';
import React from 'react';

const UnpublishedListingCardMeta = ({ meta, label }) =>
  <div className="nc-unpublishedListingCardMeta-cardMeta">
    <span className="nc-unpublishedListingCardMeta-meta">{meta}</span>
    {(label && label.length > 0)
      ? <span className="nc-unpublishedListingCardMeta-label">{label}</span>
      : ""}
  </div>;

UnpublishedListingCardMeta.propTypes = {
  meta: PropTypes.string.isRequired,
  label: PropTypes.string,
};

export default UnpublishedListingCardMeta;
