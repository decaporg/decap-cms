import React from 'react';
import { storiesOf } from '@kadira/storybook';
import { Toast } from '../UI';

const containerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: 360,
  height: '100%',
};

storiesOf('Toast', module)
  .add('All kinds stacked', () => (
    <div style={containerStyle}>
      <Toast kind="info" message="A Toast Message" />
      <Toast kind="success" message="A Toast Message" />
      <Toast kind="warning" message="A Toast Message" />
      <Toast kind="danger" message="A Toast Message" />
    </div>
  ))
  .add('Info', () => (
    <div style={containerStyle}>
      <Toast kind="info" message="A Toast Message" />
    </div>
  ))
  .add('Success', () => (
    <div style={containerStyle}>
      <Toast kind="success" message="A Toast Message" />
    </div>
  ))
  .add('Waring', () => (
    <div style={containerStyle}>
      <Toast kind="warning" message="A Toast Message" />
    </div>
  ))
  .add('Error', () => (
    <div style={containerStyle}>
      <Toast kind="danger" message="A Toast Message" />
    </div>
  ));
