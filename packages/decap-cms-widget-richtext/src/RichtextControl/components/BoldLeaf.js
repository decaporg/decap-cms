import React from 'react';
import { PlateLeaf } from '@udecode/plate-common';

function BoldLeaf({ children, ...props }) {
  return (
    <PlateLeaf asChild {...props}>
      <b>{children}</b>
    </PlateLeaf>
  );
}

export default BoldLeaf;
