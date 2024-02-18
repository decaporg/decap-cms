import React from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import MediaDialog from './';
import { Button, ButtonGroup } from '../Buttons';

export default {
  title: 'Dialogs/MediaDialog',
  component: MediaDialog,
  args: {
    open: false,
    onClose: action('onClose'),
  },
};

export function _MediaDialog(args) {
  const [{ open }, updateArgs] = useArgs();

  function toggleOpen() {
    updateArgs({ open: !open });
  }

  return (
    <>
      <ButtonGroup>
        <Button onClick={toggleOpen}>Open Choose Media Dialog</Button>
      </ButtonGroup>

      <MediaDialog {...args} open={open} onClose={toggleOpen} />
    </>
  );
}
