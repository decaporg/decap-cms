import React, { useState } from 'react';
import { withKnobs, boolean, select, text } from '@storybook/addon-knobs';

import MediaDialog from './MediaDialog';
import { Button, ButtonGroup } from '../Button';

export default {
  title: 'Dialogs/MediaDialog',
  decorators: [withKnobs],
};

const StoryDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <ButtonGroup>
        <Button onClick={() => setDialogOpen(true)}>Open Choose Media Dialog</Button>
      </ButtonGroup>
      <MediaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
};

export const _MediaDialog = () => {
  return <StoryDialog />;
};
