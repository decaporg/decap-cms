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
  { pattern: 'Search(:searchTerm as what?)' },
  { pattern: 'Go to Settings' },
  { pattern: 'Find(:seachTerm as what?)' },
  { pattern: '(:searchTerm as Find...)', token:'Find' }
];

storiesOf('FindBar', module)
  .add('Default View', () => (
    <FindBar
        commands={commands}
        dispatch={action('DISPATCH')}
    />
  ));
