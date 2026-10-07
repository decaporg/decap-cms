import styled from '@emotion/styled';
import React from 'react';

import NoteItem from './NoteItem';

import type { Note } from '@/lib/backend/index';
import type { TranslateFunction } from '@/ui/default/index';
import type { NoteUser } from './NoteItem';

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  /* The editor's view controls float over the pane's top-right corner; the
     wider right padding keeps them off the notes' timestamps. */
  padding: 8px 64px 8px 30px;
`;

/** Unresolved notes first, then newest first. */
export function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => {
    if (a.resolved !== b.resolved) {
      return a.resolved ? 1 : -1;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

interface NotesListProps {
  notes: Note[];
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
  onToggleResolution: (noteId: string) => void;
  user?: NoteUser | undefined;
  t: TranslateFunction;
}

export default function NotesList({ notes, onUpdate, onDelete, onToggleResolution, user, t }: NotesListProps) {
  return (
    <ListContainer>
      {sortNotes(notes).map(note => (
        <NoteItem
          key={note.id}
          note={note}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onToggleResolution={onToggleResolution}
          user={user}
          t={t}
        />
      ))}
    </ListContainer>
  );
}
