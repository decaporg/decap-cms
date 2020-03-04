import React, { useState } from 'react';
import styled from '@emotion/styled';
import Field from '../../Field';

const StyledInput = styled.input`
  color: ${({ theme }) => theme.color.highEmphasis};
  background: none;
  border: none;
  outline: none;
  width: calc(100% + 32px);
  font-size: ${({ title }) => (title ? '1.5rem' : '1rem')};
  line-height: 1rem;
  caret-color: ${({ theme }) => theme.color.primary['400']};
  margin: -2rem -1rem -1rem -1rem;
  padding: 2rem 1rem 1rem 1rem;
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)} ::placeholder {
    color: ${({ theme }) => theme.color.disabled};
  }
`;

const TextWidget = ({
  name,
  label,
  onChange,
  onClick,
  readOnly,
  placeholder,
  children,
  value,
  focused,
  title,
  className,
}) => {
  const [focus, setFocus] = useState();

  return (
    <Field
      onClick={onClick}
      label={label}
      labelTarget={name}
      focus={focused || focus}
      className={className}
    >
      <StyledInput
        clickable={readOnly && !!onClick}
        onClick={onClick}
        readOnly={readOnly}
        type="text"
        id={name}
        name={name}
        placeholder={placeholder ? placeholder : label ? `Type ${label.toLowerCase()} here` : ''}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        autoComplete="off"
        title={title}
      />
      {children && children}
    </Field>
  );
};

export default TextWidget;
