import React from 'react';
import RTButton from 'react-toolbox/lib/button';
import 'react-toolbox/lib/commons.scss';

const TextButton = ({ children, ...props }) => (
  <RTButton
      {...props}
      raised={false}
  >
    {children}
  </RTButton>
);

export default TextButton;
