import React from 'react';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { Button, ButtonGroup } from '.';

storiesOf('Inputs', module)
  .addDecorator(withKnobs)
  .add('Button', () => {
    // return <div>Hello world!</div>;
    return (
      <ButtonGroup>
        <Button
          size={select('size', { sm: 'sm', md: null, lg: 'lg' }, null)}
          type={select('type', { default: null, success: 'success', danger: 'danger' }, null)}
          primary={boolean('primary', false)}
          disabled={boolean('disabled', false)}
          onClick={action('onClick')}
        >
          Button
        </Button>
      </ButtonGroup>
    );
  });
