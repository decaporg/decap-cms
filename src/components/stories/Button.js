import React from 'react';
import { Button, TextButton, FloatingButton } from '../UI/index';
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
  .add('Accent', () => (
    <div>
      <Button accent>Accent</Button>
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
  .add('Accent', () => (
    <div>
      <TextButton accent>Accent</TextButton>
    </div>
  ))
  .add('Disabled', () => (
    <div>
      <TextButton disabled>Disabled</TextButton>
    </div>
  ));

storiesOf('FloatingButton', module)
  .add('Default', () => (
    <div>
      <FloatingButton icon="add"/>
    </div>
  ))
  .add('Primary', () => (
    <div>
      <FloatingButton icon="add" primary/>
    </div>
  ))
  .add('Accent', () => (
    <div>
      <FloatingButton icon="add" accent/>
    </div>
  ))
  .add('Disabled', () => (
    <div>
      <FloatingButton icon="add" disabled/>
    </div>
  ));
