import React from 'react';
import { Button } from 'decap-cms-ui-next';

export function ControlButton({ active, onClick, children }) {
  return (
    <Button type="neutral" variant={active ? 'solid' : 'soft'} onClick={onClick} hasMenu>
      {children}
    </Button>
  );
}
