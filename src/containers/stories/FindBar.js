import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import { FindBar } from '../FindBar';

const commands = [
  { pattern: 'Create new Collection(:collectionName)' },
  { pattern: 'Create new Post(:postName)' },
  { pattern: 'Create new Article(:articleName)' },
  { pattern: 'Create new FAQ item(:faqName as FAQ item name)' },
  { pattern: 'Add news item(:headline)' },
  { pattern: 'Add new User(:userName as User name)' },
  { pattern: 'Go to Settings' },
];

storiesOf('FindBar', module)
  .add('Default View', () => (
    <FindBar
        commands={commands}
        dispatch={action('DISPATCH')}
    />
  ));
