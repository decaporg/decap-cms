import React from 'react';
import { Button, TextButton } from '../UI/index';
import { storiesOf } from '@kadira/storybook';

storiesOf('Button', module)
  .add('Default', () => (
    <div>
      <Button>Default</Button>
    </div>
  ))
  .add('Primary', () => (
    <div>
      <Button primary>Primary</Button>
    </div>
  ))
  .add('Disabled', () => (
    <div>
      <Button disabled>Disabled</Button>
    </div>
  ));

storiesOf('TextButton', module)
  .add('Default', () => (
    <div>
      <TextButton>Default</TextButton>
    </div>
  ))
  .add('Primary', () => (
    <div>
      <TextButton primary>Primary</TextButton>
    </div>
  ))
  .add('Disabled', () => (
    <div>
      <TextButton disabled>Disabled</TextButton>
    </div>
  ));
