import React from 'react';
import { PlateLeaf } from '@udecode/plate-common';

function ItalicLeaf({ children, ...props }) {
  return (
    <PlateLeaf asChild {...props}>
      <em>{children}</em>
    </PlateLeaf>
  );
}

export default ItalicLeaf;
