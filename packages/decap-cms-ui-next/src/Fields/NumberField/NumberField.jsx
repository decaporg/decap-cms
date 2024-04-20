import React, { useRef, useState } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

import Field from '../../Field';
import { IconButton } from '../../Buttons';
import { StyledInput as StyledTextInput } from '../TextField';

const StyledNumberInput = styled(StyledTextInput)`
  padding-right: 3rem;

  -webkit-appearance: textfield;
  -moz-appearance: textfield;
  appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const NumberInputStepper = styled.div`
  display: flex;
  flex-direction: column;

  position: absolute;
  right: 0.5rem;
  top: 1.85rem;
`;

const NumberIncrementStepper = styled(IconButton)`
  rotate: 180deg;

  ${({ size }) => css`
    width: ${size === 'xs' ? 1.25 : 2}rem;
    height: ${size === 'xs' ? 1 : 2}rem;
  `};
`;

const NumberDecrementStepper = styled(IconButton)`
  ${({ size }) => css`
    width: ${size === 'xs' ? 1.25 : 2}rem;
    height: ${size === 'xs' ? 1 : 2}rem;
  `};
`;

function NumberField({
  name,
  label,
  status,
  placeholder,
  description,
  step,
  min,
  max,
  onChange,
  children,
  value,
  focus,
  inline,
  error,
  errors,
  ...props
}) {
  const ref = useRef(null);
  const [inputFocus, setInputFocus] = useState();

  return (
    <Field
      name={name}
      label={label}
      status={status}
      placeholder={placeholder}
      description={description}
      focus={focus || inputFocus}
      inline={inline}
      error={error}
      errors={errors}
      icon={
        <NumberInputStepper>
          <NumberIncrementStepper
            icon="chevron-down"
            size="xs"
            onClick={() => ref.current.stepUp()}
          />
          <NumberDecrementStepper
            icon="chevron-down"
            size="xs"
            onClick={() => ref.current.stepDown()}
          />
        </NumberInputStepper>
      }
      {...props}
    >
      <StyledNumberInput
        name={name}
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        ref={ref}
        onChange={e => onChange(e)}
        onFocus={() => setInputFocus(true)}
        onBlur={() => setInputFocus(false)}
      />
      {children && children}
    </Field>
  );
}

export default NumberField;
