import React from 'react';
import { storiesOf, action } from '@kadira/storybook';

import FindBar from '../FindBar/FindBar';

const CREATE_COLLECTION = 'CREATE_COLLECTION';
const CREATE_POST = 'CREATE_POST';
const CREATE_ARTICLE = 'CREATE_ARTICLE';
const CREATE_FAQ = 'CREATE_FAQ';
const ADD_NEWS = 'ADD_NEWS';
const ADD_USER = 'ADD_USER';
const OPEN_SETTINGS = 'OPEN_SETTINGS';
const HELP = 'HELP';
const MORE_COMMANDS = 'MORE_COMMANDS';

const commands = [
  { id: CREATE_COLLECTION, pattern: 'Create new Collection(:collectionName)' },
  { id: CREATE_POST, pattern: 'Create new Post(:postName)' },
  { id: CREATE_ARTICLE, pattern: 'Create new Article(:articleName)' },
  { id: CREATE_FAQ, pattern: 'Create new FAQ item(:faqName as FAQ item name)' },
  { id: ADD_NEWS, pattern: 'Add news item(:headline)' },
  { id: ADD_USER, pattern: 'Add new User(:userName as User name)' },
  { id: OPEN_SETTINGS, pattern: 'Go to Settings' },
  { id: HELP, pattern: 'Help' },
  { id: MORE_COMMANDS, pattern: 'More Commands...' },
];

const style = {
  width: 800,
  margin: 20,
};

storiesOf('FindBar', module)
  .add('Default View', () => (
    <div style={style}>
      <FindBar
        commands={commands}
        defaultCommands={[CREATE_POST, CREATE_COLLECTION, OPEN_SETTINGS, HELP, MORE_COMMANDS]}
        runCommand={action}
      />
    </div>
  ));
