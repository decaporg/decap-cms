import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import FindBar from '../FindBar/FindBar';

const style = {
  width: 800,
  margin: 20,
};

storiesOf('FindBar', module)
  .add('Default View', () => (
    <div style={style}>
      <FindBar runCommand={action} />
    </div>
  ));
