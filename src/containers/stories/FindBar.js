import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import FindBar from '../FindBar';

const commands = [
  { pattern: 'Create Collection(:collectionName)' },
  { pattern: 'Create Post(:postName)' },
  { pattern: 'Find(:seachTerm as what?)' },
  { pattern: 'Visit Alabama at(:date)' },
  { pattern: 'Visit Alaska at(:date)' },
  { pattern: 'Visit Arizona at(:date)' },
  { pattern: 'Visit Arkansas at(:date)' },
  { pattern: 'Visit California at(:date)' },
  { pattern: 'Visit Colorado at(:date)' },
  { pattern: 'Visit Connecticut at(:date)' },
  { pattern: 'Visit Delaware at(:date)' },
  { pattern: 'Visit Florida at(:date)' },
  { pattern: 'Visit Georgia at(:date)' },
  { pattern: 'Visit Hawaii at(:date)' },
  { pattern: 'Visit Idaho at(:date)' },
  { pattern: 'Visit Illinois at(:date)' },
  { pattern: 'Visit Indiana at(:date)' },
  { pattern: 'Visit Iowa at(:date)' },
  { pattern: 'Visit Kansas at(:date)' },
  { pattern: 'Visit Kentucky at(:date)' },
  { pattern: 'Visit Louisiana at(:date)' },
  { pattern: 'Visit Maine at(:date)' },
  { pattern: 'Visit Maryland at(:date)' },
  { pattern: 'Visit Massachusetts at(:date)' },
  { pattern: 'Visit Michigan at(:date)' },
  { pattern: 'Visit Minnesota at(:date)' },
  { pattern: 'Visit Mississippi at(:date)' },
  { pattern: 'Visit Missouri at(:date)' },
  { pattern: 'Visit Montana at(:date)' },
  { pattern: 'Visit Nebraska at(:date)' },
  { pattern: 'Visit Nevada at(:date)' },
  { pattern: 'Visit New Hampshire at(:date)' },
  { pattern: 'Visit New Jersey at(:date)' },
  { pattern: 'Visit New Mexico at(:date)' },
  { pattern: 'Visit New York at(:date)' },
  { pattern: 'Visit North Carolina at(:date)' },
  { pattern: 'Visit North Dakota at(:date)' },
  { pattern: 'Visit Ohio at(:date)' },
  { pattern: 'Visit Oklahoma at(:date)' },
  { pattern: 'Visit Oregon at(:date)' },
  { pattern: 'Visit Pennsylvania at(:date)' },
  { pattern: 'Visit Rhode Island at(:date)' },
  { pattern: 'Visit South Carolina at(:date)' },
  { pattern: 'Visit South Dakota at(:date)' },
  { pattern: 'Visit Tennessee at(:date)' },
  { pattern: 'Visit Texas at(:date)' },
  { pattern: 'Visit Utah at(:date)' },
  { pattern: 'Visit Vermont at(:date)' },
  { pattern: 'Visit Virginia at(:date)' },
  { pattern: 'Visit Washington at(:date)' },
  { pattern: 'Visit West Virginia at(:date)' },
  { pattern: 'Visit Wisconsin at(:date)' },
  { pattern: 'Visit Wyoming at(:date)' },
  { pattern: '(:searchTerm as Find...)', token:'Search' }
];

storiesOf('FindBar', module)
  .add('Default View', () => (
    <FindBar
        commands={commands}
        dispatch={action('DISPATCH')}
    />
  ));
