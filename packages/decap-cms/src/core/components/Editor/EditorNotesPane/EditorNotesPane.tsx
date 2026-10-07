import styled from '@emotion/styled';
import React from 'react';

import { confirmDialog } from '@/ui';
import { colors, Icon } from '@/ui/default/index';
import AddNoteForm from './AddNoteForm';
import NotesList from './NotesList';

import type { Note } from '@/lib/backend/index';
import type { TranslateFunction } from '@/ui/default/index';
import type { NoteUser } from './NoteItem';

const NotesContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
  border-left: 1px solid ${colors.textFieldBorder};
`;

const NotesHeader = styled.div`
  /* Clears the editor's floating view controls, as the list below does. */
  padding: 16px 64px 16px 24px;
  border-bottom: 1px solid ${colors.textFieldBorder};
  background-color: ${colors.inputBackground};
  display: flex;
  align-items: center;
  min-height: 60px;
`;

const NotesTitleGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const NotesTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
`;

const NotesCount = styled.span`
  background-color: ${colors.controlLabel};
  color: ${colors.textLight};
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
`;

const SourceLink = styled.a`
  color: ${colors.controlLabel};
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: ${colors.text};
    text-decoration: underline;
  }
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
  font-size: 14px;
  line-height: 1.4;
`;

type SourceInfo = { textKey: string, iconType: 'github' | 'gitlab' | 'link' };

const SOURCES: Record<string, SourceInfo> = {
  github: { textKey: 'editor.editorNotesPane.viewInGitHub', iconType: 'github' },
  gitlab: { textKey: 'editor.editorNotesPane.viewInGitLab', iconType: 'gitlab' },
};

const GENERIC_SOURCE: SourceInfo = { textKey: 'editor.editorNotesPane.viewSource', iconType: 'link' };

/** Label and icon for the link to the notes' thread on the host. */
export function getSourceInfo(url: string, backendName: string | undefined): SourceInfo {
  if (backendName && SOURCES[backendName]) {
    return SOURCES[backendName];
  }

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return GENERIC_SOURCE;
  }

  const isHost = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (isHost('github.com')) return SOURCES.github;
  if (isHost('gitlab.com')) return SOURCES.gitlab;
  return GENERIC_SOURCE;
}

export type NotesChange =
  | { action: 'ADD_NOTE', note: Omit<Note, 'id'> }
  | { action: 'UPDATE_NOTE', id: string, updates: Partial<Note> }
  | { action: 'DELETE_NOTE', id: string };

interface EditorNotesPaneProps {
  notes?: Note[] | undefined;
  onChange: (change: NotesChange) => void;
  user?: (NoteUser & { backendName?: string | undefined }) | undefined;
  t: TranslateFunction;
}

/**
 * The editor's notes pane (decaporg #7563): the open entry's notes, newest
 * unresolved first, and a form to add one. Only the author of a note can
 * edit, resolve or delete it.
 */
export default function EditorNotesPane({ notes = [], onChange, user, t }: EditorNotesPaneProps) {
  const unresolvedCount = notes.filter(note => !note.resolved).length;
  const sourceUrl = notes[0]?.issueUrl;
  const sourceInfo = sourceUrl ? getSourceInfo(sourceUrl, user?.backendName) : null;

  function handleAdd(content: string) {
    onChange({
      action: 'ADD_NOTE',
      note: {
        content,
        author: user?.login || user?.name || 'Anonymous',
        resolved: false,
        timestamp: new Date().toISOString(),
        entrySlug: '',
      },
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await confirmDialog(t('editor.editorNotesPane.confirmDelete'), {
      title: t('editor.editorNotesPane.delete'),
      confirmLabel: t('editor.editorNotesPane.delete'),
      cancelLabel: t('editor.editorNotesPane.cancel'),
      destructive: true,
    });
    if (confirmed) {
      onChange({ action: 'DELETE_NOTE', id });
    }
  }

  function handleToggleResolution(id: string) {
    const note = notes.find(n => n.id === id);
    onChange({ action: 'UPDATE_NOTE', id, updates: { resolved: !note?.resolved } });
  }

  return (
    <NotesContainer role="complementary" aria-label={t('editor.editorNotesPane.title')}>
      <NotesHeader>
        <NotesTitleGroup>
          <NotesTitle>{t('editor.editorNotesPane.title')}</NotesTitle>
          {notes.length > 0 && <NotesCount>{unresolvedCount > 0 ? unresolvedCount : notes.length}</NotesCount>}
          {sourceInfo && sourceUrl && (
            <SourceLink href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <span>{t(sourceInfo.textKey)}</span>
              <Icon type={sourceInfo.iconType} size="small" />
            </SourceLink>
          )}
        </NotesTitleGroup>
      </NotesHeader>
      <NotesContent>
        {notes.length === 0
          ? <EmptyState>{t('editor.editorNotesPane.emptyState')}</EmptyState>
          : (
            <NotesList
              notes={notes}
              onUpdate={(id, updates) => onChange({ action: 'UPDATE_NOTE', id, updates })}
              onDelete={handleDelete}
              onToggleResolution={handleToggleResolution}
              user={user}
              t={t}
            />
          )}
        <AddNoteForm onAdd={handleAdd} t={t} />
      </NotesContent>
    </NotesContainer>
  );
}
