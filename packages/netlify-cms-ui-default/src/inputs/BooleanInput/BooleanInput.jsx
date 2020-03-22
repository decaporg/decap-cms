import React from 'react';
import Field from '../../Field';
import ToggleSwitch from '../../ToggleSwitch';

const BooleanInput = ({ name, label, onChange, className, children, value, inline }) => {
  return (
    <Field
      label={label}
      labelTarget={name}
      control
      onClick={() => (value ? onChange(false) : onChange(true))}
      className={className}
      inline={inline}
    >
      <ToggleSwitch
        onChange={() => (value && onChange ? onChange(false) : onChange(true))}
        checked={value}
      />
      {children && children}
    </Field>
  );
};

export default BooleanInput;
