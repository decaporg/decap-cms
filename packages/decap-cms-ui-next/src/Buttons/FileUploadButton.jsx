import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import { Button } from './';

const HiddenInputFile = styled.input`
  height: 0.1px;
  width: 0.1px;
  margin: 0px;
  padding: 0px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
  outline: none;
`;

function FileUploadButton({
  label,
  icon = 'upload-cloud',
  size,
  disabled,
  accept,
  onChange,
  ...props
}) {
  const inputRef = useRef(null);

  return (
    <label>
      <Button
        size={size}
        icon={icon}
        disabled={disabled}
        onClick={() => inputRef.current.click()}
        {...props}
      >
        {label}
      </Button>

      <HiddenInputFile
        type="file"
        ref={inputRef}
        accept={accept}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}

FileUploadButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  accept: PropTypes.oneOf(['audio/*', 'image/*', 'video/*', '*/*']),
  onChange: PropTypes.func.isRequired,
};

export default FileUploadButton;
