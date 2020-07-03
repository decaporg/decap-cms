import React, { useState } from 'react';
import MediaDialog from './MediaDialog';
import { Button } from '../Button';

export default {
  title: 'Components/MediaDialog',
};

const StoryDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>Media</Button>
      <MediaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
};

export const _MediaDialog = () => {
  return <MediaDialog />;
};
