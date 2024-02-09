import React from 'react';

import { Button, ButtonGroup } from '../Buttons';
import { ToastContainer, toast } from '../Toast';
import { NotificationCenter } from '.';

export default {
  title: 'Components/Toast',
  component: NotificationCenter,
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      table: {
        category: 'Toast',
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
  },
  args: {
    type: 'info',
    title: 'Notification Title',
    content: 'This is a notification content.',
    autoClose: 5000,
  },
};

export function _NotificationCenter(args) {
  return (
    <>
      <ButtonGroup>
        <Button onClick={() => toast({ ...args })}>Pop a Toast</Button>
      </ButtonGroup>

      <NotificationCenter />
      <ToastContainer />
    </>
  );
}
