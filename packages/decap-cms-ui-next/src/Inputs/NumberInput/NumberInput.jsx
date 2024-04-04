import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

import Field from '../../Field';
import { IconButton } from '../../Buttons';
import { StyledInput as StyledTextInput } from '../TextInput/TextInput';

const StyledInput = styled(StyledTextInput)`
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
  right: 0;
  bottom: -0.5rem;
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

function NumberInput({ name, step, min, max, onChange, children, value, ...props }) {
  const ref = useRef(null);

  return (
    <Field {...props}>
      <StyledInput
        type="number"
        name={name}
        value={value}
        step={step}
        min={min}
        max={max}
        ref={ref}
        onChange={e => onChange(e)}
      />

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

      {children && children}
    </Field>
  );
}

export default NumberInput;
