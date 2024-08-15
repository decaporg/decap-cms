import React, { useState, forwardRef } from 'react';
import styled from '@emotion/styled';

import Field from '../../Field';

export const StyledInput = styled.input`
  color: ${({ theme }) => theme.color.highEmphasis};
  background: none;
  border: none;
  outline: none;
  width: calc(100% + 32px);
  font-family: inherit;
  font-size: ${({ title }) => (title ? '2rem' : '1rem')};
  font-weight: ${({ title }) => (title ? 'bold' : 'normal')};
  letter-spacing: ${({ title }) => (title ? '-0.5px' : '0')};
  line-height: 1rem;
  caret-color: ${({ theme, error }) =>
    error ? theme.color.danger['900'] : theme.color.primary['800']};
  margin: -2rem -1rem -1rem -1rem;
  padding: 2rem 1rem 1rem 1rem;
  ${({ clickable }) => (clickable ? `cursor: pointer;` : ``)} ::placeholder {
    color: ${({ theme }) => theme.color.disabled};
  }
`;

const TextField = forwardRef(
  (
    {
      name,
      label,
      icon,
      description,
      status,
      onChange,
      onClick,
      readOnly,
      placeholder,
      children,
      value,
      focus,
      title,
      type,
      password,
      className,
      filled,
      error,
      errors,
    },
    ref,
  ) => {
    const [inputFocus, setInputFocus] = useState();

    return (
      <Field
        onClick={onClick}
        label={label}
        labelTarget={name}
        description={description}
        status={status}
        focus={focus || inputFocus}
        className={className}
        filled={filled}
        error={error}
        errors={errors}
        icon={icon}
        clickable={!readOnly}
      >
        <StyledInput
          ref={ref}
          clickable={readOnly && !!onClick}
          onClick={onClick}
          readOnly={readOnly}
          type={password ? 'password' : type ? type : 'text'}
          autoFocus={focus}
          id={name}
          name={name}
          placeholder={placeholder ? placeholder : label ? `Type ${label.toLowerCase()} here` : ''}
          value={value || ''}
          onChange={e => onChange(e)}
          onFocus={() => setInputFocus(true)}
          onBlur={() => setInputFocus(false)}
          autoComplete="off"
          title={title}
          error={error}
        />
        {children && children}
      </Field>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
