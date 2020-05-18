import React from 'react';
import Field from '../../Field';
import ToggleSwitch from '../../ToggleSwitch';

const BooleanInput = ({ name, onChange, children, value, ...props }) => {
  return (
    <Field
      {...props}
      labelTarget={name}
      control
      onClick={() => (value ? onChange(false) : onChange(true))}
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
