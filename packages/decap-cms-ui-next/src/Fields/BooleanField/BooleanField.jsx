import React from 'react';

import Field from '../../Field';
import Switch from '../../Switch';

function BooleanField({ name, onChange, children, value, ...props }) {
  return (
    <Field
      {...props}
      labelTarget={name}
      control
      onClick={() => (value ? onChange(false) : onChange(true))}
    >
      <Switch
        onChange={() => (value && onChange ? onChange(false) : onChange(true))}
        checked={value}
      />
      {children && children}
    </Field>
  );
}

export default BooleanField;
