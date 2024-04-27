import React, { useState } from 'react';
import { default as TextareaAutoSize } from 'react-textarea-autosize';
import styled from '@emotion/styled';

import Field from '../../Field';

const StyledTextarea = styled(TextareaAutoSize)`
  color: ${({ theme }) => theme.color.highEmphasis};
  background: none;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  width: calc(100% + 32px);
  font-family: inherit;
  font-size: ${({ title }) => (title ? '2rem' : '1rem')};
  font-weight: ${({ title }) => (title ? 'bold' : 'normal')};
  letter-spacing: ${({ title }) => (title ? '-0.5px' : '0')};
  line-height: 1.5rem;
  caret-color: ${({ theme, error }) =>
    error ? theme.color.danger['900'] : theme.color.primary['800']};
  margin: -2rem -1rem -1rem -1rem;
  padding: 2rem 1rem 1rem 1rem;
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)} ::placeholder {
    color: ${({ theme }) => theme.color.disabled};
  }
`;

function TextareaField({
  name,
  label,
  status,
  placeholder,
  description,
  value,
  onChange,
  focus,
  inline,
  error,
  errors,
  minRows = 5,
  ...props
}) {
  const [inputFocus, setInputFocus] = useState();

  return (
    <Field
      label={label}
      labelTarget={name}
      status={status}
      description={description}
      focus={focus || inputFocus}
      inline={inline}
      error={error}
      errors={errors}
      {...props}
    >
      <StyledTextarea
        id={name}
        value={value || ''}
        placeholder={placeholder}
        minRows={minRows}
        onChange={onChange}
        onFocus={() => setInputFocus(true)}
        onBlur={() => setInputFocus(false)}
        error={error}
      />
    </Field>
  );
}

export default TextareaField;
