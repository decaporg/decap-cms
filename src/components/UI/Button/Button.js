import React from 'react';
import RTButton from 'react-toolbox/lib/button';
import 'react-toolbox/lib/commons.scss';

const Button = ({ children, ...props }) => (
  <RTButton
      {...props}
      raised
  >
    {children}
  </RTButton>
);

export default Button;
