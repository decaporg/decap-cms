import React from 'react';
import { Button } from 'decap-cms-ui-next';

export function ControlButton({ active, onClick, children }) {
  return (
    <Button type={active ? 'success' : 'default'} onClick={onClick} hasMenu>
      {children}
    </Button>
  );
}
