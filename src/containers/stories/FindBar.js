import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import { FindBar } from '../FindBar';

const commands = [
  { id:'CREATE_COLLECTION', pattern: 'Create new Collection(:collectionName)' },
  { id:'CREATE_POST', pattern: 'Create new Post(:postName)' },
  { id:'CREATE_ARTICLE', pattern: 'Create new Article(:articleName)' },
  { id:'CREATE_FAQ', pattern: 'Create new FAQ item(:faqName as FAQ item name)' },
  { id:'ADD_NEWS', pattern: 'Add news item(:headline)' },
  { id:'ADD_USER', pattern: 'Add new User(:userName as User name)' },
  { id:'OPEN_SETTINGS', pattern: 'Go to Settings' },
];

const style = {
  width: 800,
  margin: 20
};

const dispatch = action('DISPATCH');

storiesOf('FindBar', module)
  .add('Default View', () => (
    <div style={style}>
      <FindBar
          commands={commands}
          dispatch={f => f(dispatch)}
      />
    </div>
  ));
