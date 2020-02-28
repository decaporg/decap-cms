import React, { useState } from 'react';
import styled from '@emotion/styled';
import Field from '../Field';
import ToggleSwitch from '../ToggleSwitch';

const TextWidget = ({ name, label, onChange, placeholder, children, value }) => {
  return (
    <Field
      label={label}
      labelTarget={name}
      control
      onClick={() => (value ? onChange(false) : onChange(true))}
    >
      <ToggleSwitch onChange={() => (value ? onChange(false) : onChange(true))} checked={value} />
      {children && children}
    </Field>
  );
};

export default TextWidget;
