import styled from '@emotion/styled';
import React, { useState } from 'react';

import { colors, transitions } from '@/ui/default/index';

import type { Note } from '@/lib/backend/index';
import type { TranslateFunction } from '@/ui/default/index';

const NoteCard = styled.div<{ $resolved: boolean }>`
  background-color: ${props => (props.$resolved ? colors.inputBackground : colors.foreground)};
  border: 1px solid ${colors.textFieldBorder};
  border-radius: 4px;
  margin-bottom: 8px;
  padding: 12px 18px;
  transition: all ${transitions.main};
  opacity: ${props => (props.$resolved ? 0.7 : 1)};

  &:hover {
    border-color: ${colors.active};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const NoteAuthor = styled.span`
  font-size: 12px;
  color: ${colors.controlLabel};
  font-weight: 500;
`;

const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${colors.inputBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarInitials = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${colors.controlLabel};
  text-transform: uppercase;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const NoteTimestamp = styled.span`
  font-size: 11px;
  color: ${colors.controlLabel};
`;

const NoteText = styled.p`
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.4;
  color: ${colors.text};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const EditableText = styled.textarea`
  width: 100%;
  min-height: 60px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid ${colors.active};
  border-radius: 3px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  resize: vertical;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px ${colors.activeBackground};
  }
`;

const NoteActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  color: ${colors.controlLabel};
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  transition: all ${transitions.main};

  &:hover:not(:disabled) {
    background-color: ${colors.inputBackground};
    color: ${props => (props.$danger ? colors.errorText : colors.active)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResolvedBadge = styled.span`
  background-color: ${colors.successText};
  color: ${colors.textLight};
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  text-transform: uppercase;
`;

export interface NoteUser {
  login?: string | undefined;
  name?: string | undefined;
}

/**
 * Whether the signed-in editor wrote `note`. The backend decides when it can
 * (`isOwn`): the account that posted a note may be an app or bot rather than
 * the editor.
 */
export function isOwnNote(note: Note, user: NoteUser | undefined) {
  if (note.isOwn !== undefined) {
    return note.isOwn;
  }
  return note.author === (user?.login || user?.name || 'Anonymous');
}

function initials(author: string) {
  return author
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .slice(0, 2);
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

interface NoteItemProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
  onToggleResolution: (noteId: string) => void;
  user?: NoteUser | undefined;
  t: TranslateFunction;
}

export default function NoteItem({ note, onUpdate, onDelete, onToggleResolution, user, t }: NoteItemProps) {
  const [editContent, setEditContent] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const isOwn = isOwnNote(note, user);
  const isEditing = editContent !== null;

  function save() {
    const trimmed = (editContent ?? '').trim();
    if (trimmed && trimmed !== note.content) {
      onUpdate(note.id, { content: trimmed });
    }
    setEditContent(null);
  }

  const showAvatar = !!note.avatarUrl && !avatarFailed;

  return (
    <NoteCard $resolved={note.resolved} data-testid="note-item">
      <NoteHeader>
        <AuthorSection>
          <Avatar>
            {showAvatar
              ? (
                <AvatarImage
                  src={note.avatarUrl}
                  alt={`${note.author} avatar`}
                  onError={() => setAvatarFailed(true)}
                />
              )
              : <AvatarInitials>{initials(note.author)}</AvatarInitials>}
          </Avatar>
          <NoteAuthor>{note.author}</NoteAuthor>
        </AuthorSection>
        <Meta>
          {note.resolved && <ResolvedBadge>{t('editor.editorNotesPane.resolved')}</ResolvedBadge>}
          <NoteTimestamp>{formatTimestamp(note.timestamp)}</NoteTimestamp>
        </Meta>
      </NoteHeader>
      {isEditing
        ? (
          <EditableText
            value={editContent}
            onChange={event => setEditContent(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                save();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setEditContent(null);
              }
            }}
            placeholder={t('editor.editorNotesPane.editPlaceholder')}
            aria-label={t('editor.editorNotesPane.editPlaceholder')}
            autoFocus
          />
        )
        : <NoteText>{note.content}</NoteText>}
      <NoteActions>
        {isEditing
          ? (
            <>
              <ActionButton type="button" onClick={save}>
                {t('editor.editorNotesPane.save')}
              </ActionButton>
              <ActionButton type="button" onClick={() => setEditContent(null)}>
                {t('editor.editorNotesPane.cancel')}
              </ActionButton>
            </>
          )
          : (
            <>
              {!note.resolved && (
                <ActionButton
                  type="button"
                  onClick={() => setEditContent(note.content)}
                  disabled={!isOwn}
                >
                  {t('editor.editorNotesPane.edit')}
                </ActionButton>
              )}
              <ActionButton type="button" onClick={() => onToggleResolution(note.id)} disabled={!isOwn}>
                {note.resolved ? t('editor.editorNotesPane.unresolve') : t('editor.editorNotesPane.resolve')}
              </ActionButton>
              <ActionButton type="button" $danger onClick={() => onDelete(note.id)} disabled={!isOwn}>
                {t('editor.editorNotesPane.delete')}
              </ActionButton>
            </>
          )}
      </NoteActions>
    </NoteCard>
  );
}
