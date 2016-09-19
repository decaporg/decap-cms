import React from 'react';
import { Toast } from '../UI';
import { storiesOf } from '@kadira/storybook';


storiesOf('Toast', module)
  .add('Success', () => (
    <div>
      <Toast type='success' show>A Toast Message</Toast>
    </div>
  )).add('Waring', () => (
    <div>
      <Toast type='warning' show>A Toast Message</Toast>
    </div>
  )).add('Error', () => (
    <div>
      <Toast type='error' show>A Toast Message</Toast>
    </div>
  ));
