import React from 'react';
import { PlateElement } from 'platejs/react';

function BreakElement(props) {
  return (
    <PlateElement as="span" contentEditable={false} {...props}>
      <br />
    </PlateElement>
  );
}

export default BreakElement;
