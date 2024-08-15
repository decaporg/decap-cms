import React from 'react';
import { action } from '@storybook/addon-actions';

import { useAlert, useConfirm, usePrompt } from '../hooks/useAlertDialog';
import { Button } from '../Buttons';
import { AlertDialogProvider } from './AlertDialogProvider';

export default {
  title: 'hooks/useAlertDialog',
  decorators: [
    Story => (
      <AlertDialogProvider>
        <Story />
      </AlertDialogProvider>
    ),
  ],
};

export function _useAlert(args) {
  const alert = useAlert();

  return <Button onClick={() => alert(args)}>Alert Dialog</Button>;
}

_useAlert.args = {
  title: 'Alert Dialog Title',
  message: 'This is an alert dialog message',
  actionButton: 'OK',
};

export function _useConfirm(args) {
  const confirm = useConfirm();

  return <Button onClick={() => confirm(args)}>Confirm Dialog</Button>;
}

_useConfirm.args = {
  title: 'Confirm Dialog Title',
  message: 'This is a confirm dialog message',
  actionButton: 'OK',
  cancelButton: 'Cancel',
};

export function _usePrompt(args) {
  const prompt = usePrompt();

  return <Button onClick={() => prompt(args)}>Prompt Dialog</Button>;
}

_usePrompt.args = {
  title: 'Prompt Dialog Title',
  message: 'This is a prompt dialog message',
  defaultValue: 'Default value',
  actionButton: 'OK',
  cancelButton: 'Cancel',
};
