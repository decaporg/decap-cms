import React from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import Dialog from '.';
import { Button, ButtonGroup } from '../Buttons';

export default {
  title: 'Components/Dialog',
  argTypes: {
    title: { control: 'text' },
    'position.x': {
      control: 'select',
      options: ['left', 'center', 'right', 'stretch'],
      table: {
        defaultValue: { summary: 'center' },
      },
    },
    'position.y': {
      control: 'select',
      options: ['top', 'center', 'bottom', 'stretch'],
      table: {
        defaultValue: { summary: 'center' },
      },
    },
    actions: { control: 'boolean' },
  },
  args: {
    title: 'Dialog Title',
    position: { x: 'center', y: 'center' },
    actions: true,
    children: 'Dialog Content',
    open: false,
    onClose: action('onClose'),
    onEscapeKeyDown: action('onEscapeKeyDown'),
    onEnter: action('onEnter'),
    onEntering: action('onEntering'),
    onEntered: action('onEntered'),
    onExit: action('onExit'),
    onExiting: action('onExiting'),
    onExited: action('onExited'),
  },
};

export function _Dialog(args) {
  const [{ open }, updateArgs] = useArgs();

  function toggleOpen() {
    updateArgs({ open: !open });
  }

  return (
    <>
      <ButtonGroup>
        <Button onClick={toggleOpen}>Open Dialog</Button>
      </ButtonGroup>

      <Dialog
        {...args}
        open={open}
        onClose={toggleOpen}
        actions={
          args.actions && (
            <ButtonGroup>
              <Button onClick={toggleOpen}>Cancel</Button>
              <Button primary type="success" onClick={toggleOpen}>
                Save
              </Button>
            </ButtonGroup>
          )
        }
      />
    </>
  );
}
