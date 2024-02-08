import React from 'react';

import { Button, ButtonGroup } from '../Buttons';
import { ToastContainer, addNotification } from '.';

export default {
  title: 'Components/Toast',
};

export function _Toast(args) {
  function addToast() {
    addNotification(args);
  }

  return (
    <>
      <ButtonGroup>
        <Button onClick={addToast}>Pop a Toast</Button>
      </ButtonGroup>

      <ToastContainer />
    </>
  );
}

_Toast.argTypes = {
  type: {
    control: 'select',
    options: ['info', 'success', 'warning', 'error'],
  },
  title: {
    control: 'text',
  },
  content: {
    control: 'text',
  },
};

_Toast.args = {
  type: 'info',
  title: 'Notification Title',
  content: 'This is a notification content.',
};
