import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import { Button } from './';

const StyledButton = styled(Button)`
  margin: 0 !important;
`;

const HiddenInputFile = styled.input`
  height: 0.1px;
  width: 0.1px;
  margin: 0;
  padding: 0;
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
      <StyledButton
        size={size}
        icon={icon}
        disabled={disabled}
        onClick={() => inputRef.current.click()}
        {...props}
      >
        {label}
      </StyledButton>

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
