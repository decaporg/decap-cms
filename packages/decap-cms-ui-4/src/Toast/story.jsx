import React from 'react';
import { withKnobs, number, select, text } from '@storybook/addon-knobs';

import { toast, ToastContainer } from '.';
import { Button, ButtonGroup } from '../Button';

export default {
  title: 'Components/Toast',
  decorators: [withKnobs],
};

export const _Toast = () => {
  const title = text('title', 'Care for some toast?');
  const content = text('content', 'I like my toast with butter and JAM!');
  const type = select(
    'type',
    { default: null, success: 'success', warning: 'warning', error: 'error' },
    null,
  );
  const autoClose =
    number('autoClose', 5000, { range: true, min: 0, max: 10000, step: 250 }) || false;

  return (
    <div>
      <ButtonGroup>
        <Button onClick={() => toast({ title, content, type, autoClose })}>Pop a Toast</Button>
      </ButtonGroup>
      <ToastContainer />
    </div>
  );
};
