import React from 'react';
import PropTypes from 'prop-types';

export function FileUploadButton({ label, imagesOnly, onChange, disabled, className }) {
  return (
    <label tabIndex={'0'} className={`nc-fileUploadButton ${className || ''}`}>
      <span>{label}</span>
      <input
        type="file"
        accept={imagesOnly ? 'image/*' : '*/*'}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}

FileUploadButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  imagesOnly: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
