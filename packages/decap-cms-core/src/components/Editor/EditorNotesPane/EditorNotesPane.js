import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { List } from 'immutable';
import { colors } from 'decap-cms-ui-default';

import NotesList from './NotesList';
import AddNoteForm from './AddNoteForm';

const NotesContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
  border-left: 1px solid ${colors.textFieldBorder};
`;

const NotesHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${colors.textFieldBorder};
  background-color: ${colors.inputBackground};
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 60px;
`;

const NotesTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
`;

const NotesCount = styled.span`
  background-color: ${colors.controlLabel};
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
`;

const NotesContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  color: ${colors.controlLabel};
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.p`
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
`;

class EditorNotesPane extends Component {
  static propTypes = {
    notes: ImmutablePropTypes.list,
    onChange: PropTypes.func.isRequired,
    entry: ImmutablePropTypes.map.isRequired,
    collection: ImmutablePropTypes.map.isRequired,
    t: PropTypes.func,
  };

  static defaultProps = {
    notes: List(),
    t: key => key, // Fallback translation function
  };

  handleAddNote = content => {
    const { onChange, user } = this.props;
    const newNote = {
      content: content.trim(),
      author: user?.name || user?.login || 'Anonymous',
      resolved: false,
    };

    onChange('ADD_NOTE', newNote);
  };

  handleUpdateNote = (noteId, updates) => {
    const { onChange } = this.props;
    onChange('UPDATE_NOTE', { id: noteId, updates });
  };

  handleDeleteNote = noteId => {
    const { onChange } = this.props;
    onChange('DELETE_NOTE', { id: noteId });
  };

  handleResolveNote = noteId => {
    this.handleUpdateNote(noteId, { resolved: true });
  };

  render() {
    const { notes, t } = this.props;
    const notesList = notes && notes.size !== undefined ? notes : List(notes || []);
    const notesCount = notesList.size;
    const unresolvedCount = notesList.filter(note => !note.get('resolved')).size;

    return (
      <NotesContainer>
        <NotesHeader>
          <NotesTitle>{t('editor.editorNotesPane.title')}</NotesTitle>
          {notesCount > 0 && (
            <NotesCount>{unresolvedCount > 0 ? unresolvedCount : notesCount}</NotesCount>
          )}
        </NotesHeader>

        <NotesContent>
          {notesCount === 0 ? (
            <EmptyState>
              <EmptyStateIcon>📝</EmptyStateIcon>
              <EmptyStateText>{t('editor.editorNotesPane.emptyState')}</EmptyStateText>
            </EmptyState>
          ) : (
            <NotesList
              notes={notesList}
              onUpdate={this.handleUpdateNote}
              onDelete={this.handleDeleteNote}
              onResolve={this.handleResolveNote}
              t={t}
            />
          )}

          <AddNoteForm onAdd={this.handleAddNote} t={t} />
        </NotesContent>
      </NotesContainer>
    );
  }
}

export default EditorNotesPane;
