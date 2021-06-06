import React from 'react';
import styled from '@emotion/styled';

import CreateNote from './CreateNote';
import NoteList from './NoteList';

const NotesContainer = styled.div`
  overflow: none;
  display: flex;
  flex-direction: column;
  height: calc(100% - 48px);
`;

export default function EditorNotesPane() {
  return (
    <NotesContainer>
      <NoteList />
      <CreateNote />
    </NotesContainer>
  );
}
