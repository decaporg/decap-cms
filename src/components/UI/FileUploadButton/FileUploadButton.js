import React from 'react';
import PropTypes from 'prop-types';

export const FileUploadButton = ({ label, imagesOnly, onChange, disabled, className }) => (
  <label className={`nc-fileUploadButton ${className || ''}`}>
    <span>{label}</span>
    <input
      type="file"
      accept={imagesOnly ? 'image/*' : '*/*'}
      onChange={onChange}
      disabled={disabled}
    />
  </label>
);

FileUploadButton.propTypes = {
  label: PropTypes.string.isRequired,
  imagesOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
