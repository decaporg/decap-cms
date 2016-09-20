import React from 'react';
import RTButton from 'react-toolbox/lib/button';
import 'react-toolbox/lib/commons.scss';

const FloatingButton = ({ children, ...props }) => (
  <RTButton
      {...props}
      floating
  >
    {children}
  </RTButton>
);

FloatingButton.propTypes = {
  children: React.PropTypes.node
};

export default FloatingButton;
