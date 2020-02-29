import React from 'react';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { Button, ButtonGroup, IconButton } from '.';
import { iconComponents } from '../Icon/Icon';

storiesOf('Inputs', module)
  .addDecorator(withKnobs)
  .add('Button', () => {
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
  })
  .add('IconButton', () => {
    return (
      <ButtonGroup>
        <IconButton
          icon={select(
            'name',
            {
              default: null,
              ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
            },
            null,
          )}
          size={select('size', { sm: 'sm', md: null, lg: 'lg' }, null)}
          active={boolean('active', false)}
          onClick={action('onClick')}
        />
      </ButtonGroup>
    );
  });
