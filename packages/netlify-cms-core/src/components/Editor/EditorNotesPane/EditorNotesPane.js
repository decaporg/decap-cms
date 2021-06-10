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

class EditorNotesPane extends React.Component() {
  render() {
    return (
      <NotesContainer>
        <NoteList />
        <CreateNote />
      </NotesContainer>
    );
  }
}

export default EditorNotesPane;
