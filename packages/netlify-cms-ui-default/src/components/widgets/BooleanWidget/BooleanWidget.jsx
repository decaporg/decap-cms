import React from 'react';
import Field from '../../Field';
import ToggleSwitch from '../../ToggleSwitch';

const BooleanWidget = ({ name, label, onChange, className, children, value }) => {
  return (
    <Field
      label={label}
      labelTarget={name}
      control
      onClick={() => (value ? onChange(false) : onChange(true))}
      className={className}
    >
      <ToggleSwitch
        onChange={() => (value && onChange ? onChange(false) : onChange(true))}
        checked={value}
      />
      {children && children}
    </Field>
  );
};

export default BooleanWidget;
