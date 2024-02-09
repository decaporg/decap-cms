import React from 'react';

import { Button, ButtonGroup } from '../Buttons';
import { ToastContainer, toast } from '.';

export default {
  title: 'Components/Toast',
};

export function _Toast(args) {
  return (
    <div>
      <ButtonGroup>
        <Button onClick={() => toast({ ...args })}>Pop a Toast</Button>
      </ButtonGroup>

      <ToastContainer />
    </div>
  );
}

_Toast.argTypes = {
  type: {
    control: 'select',
    options: ['info', 'success', 'warning', 'error'],
    table: {
      defaultValue: {
        summary: 'info',
      },
    },
  },
  title: {
    control: 'text',
  },
  content: {
    control: 'text',
  },
  autoClose: {
    control: {
      type: 'number',
      min: 0,
      max: 10000,
      step: 1000,
    },
    table: {
      defaultValue: {
        summary: 5000,
      },
    },
  },
};

_Toast.args = {
  type: 'info',
  title: 'Notification Title',
  content: 'This is a notification content.',
  autoClose: 5000,
};
