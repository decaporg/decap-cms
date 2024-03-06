import React, { useState } from 'react';
import { withKnobs, boolean, select, text } from '@storybook/addon-knobs';

import Dialog from '.';
import { Button, ButtonGroup } from '../Button';

export default {
  title: 'Components/Dialog',
  decorators: [withKnobs],
};

const StoryDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <ButtonGroup>
        <Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>
      </ButtonGroup>
      <Dialog
        title={text('title', 'Default dialog')}
        open={dialogOpen}
        position={{
          x: select(
            'position.x',
            {
              left: 'left',
              'center (default)': 'center',
              right: 'right',
              stretch: 'stretch',
            },
            'center',
          ),
          y: select(
            'position.y',
            {
              top: 'top',
              'center (default)': 'center',
              bottom: 'bottom',
              stretch: 'stretch',
            },
            'center',
          ),
        }}
        onClose={() => setDialogOpen(false)}
        actions={
          boolean('actions', true) && (
            <ButtonGroup>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button primary type="success" onClick={() => setDialogOpen(false)}>
                Okie day
              </Button>
            </ButtonGroup>
          )
        }
      >
        {text('children', 'Help me, Obi-Wan Kenobi. You’re my only hope.')}
      </Dialog>
    </div>
  );
};

export const _Dialog = () => <StoryDialog />;
