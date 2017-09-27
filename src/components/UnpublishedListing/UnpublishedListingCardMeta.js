import PropTypes from 'prop-types';
import React from 'react';
import { prefixer } from '../../lib/styleHelper';

const styles = prefixer('unpublishedListingCardMeta');

const UnpublishedListingCardMeta = ({ meta, label }) =>
  <div className={styles("cardMeta")}>
    <span className={styles("meta")}>{meta}</span>
    {(label && label.length > 0)
      ? <span className={styles("label")}>{label}</span>
      : ""}
  </div>;

UnpublishedListingCardMeta.propTypes = {
  meta: PropTypes.string.isRequired,
  label: PropTypes.string,
};

export default UnpublishedListingCardMeta;
