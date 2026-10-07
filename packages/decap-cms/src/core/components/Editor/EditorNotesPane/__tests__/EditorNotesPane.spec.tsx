import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import EditorNotesPane, { getSourceInfo } from '@/core/components/Editor/EditorNotesPane/EditorNotesPane';
import { isOwnNote } from '@/core/components/Editor/EditorNotesPane/NoteItem';
import { sortNotes } from '@/core/components/Editor/EditorNotesPane/NotesList';

import type { Note } from '@/lib/backend/index';

const t = (key: string) => key;

function note(id: string, extra: Partial<Note> = {}): Note {
  return {
    id,
    content: `note ${id}`,
    author: 'alice',
    timestamp: '2026-10-01T10:00:00Z',
    entrySlug: 'post',
    resolved: false,
    ...extra,
  };
}

describe('EditorNotesPane (decaporg #7563)', () => {
  it('lists unresolved notes first, newest first', () => {
    const sorted = sortNotes([
      note('old', { timestamp: '2026-10-01T09:00:00Z' }),
      note('resolved', { resolved: true, timestamp: '2026-10-02T00:00:00Z' }),
      note('new', { timestamp: '2026-10-01T11:00:00Z' }),
    ]);

    expect(sorted.map(n => n.id)).toEqual(['new', 'old', 'resolved']);
  });

  it('lets only the author act on a note, trusting the backend when it knows', () => {
    expect(isOwnNote(note('1'), { login: 'alice' })).toBe(true);
    expect(isOwnNote(note('1'), { login: 'bob' })).toBe(false);
    expect(isOwnNote(note('1', { isOwn: true }), { login: 'bob' })).toBe(true);
    expect(isOwnNote(note('1', { isOwn: false }), { login: 'alice' })).toBe(false);
  });

  it('labels the thread link by backend, then by host', () => {
    expect(getSourceInfo('https://example.com/x', 'github').iconType).toBe('github');
    expect(getSourceInfo('https://gitlab.com/o/r/-/merge_requests/1', undefined).iconType).toBe('gitlab');
    expect(getSourceInfo('https://code.github.com/o/r/pull/1', undefined).iconType).toBe('github');
    expect(getSourceInfo('https://github.com.evil.example/x', undefined).iconType).toBe('link');
    expect(getSourceInfo('not a url', undefined).iconType).toBe('link');
  });

  it('shows the unresolved count and the empty state', () => {
    const { rerender } = render(<EditorNotesPane notes={[]} onChange={vi.fn()} t={t} />);
    expect(screen.getByText('editor.editorNotesPane.emptyState')).toBeInTheDocument();

    rerender(
      <EditorNotesPane notes={[note('1'), note('2', { resolved: true })]} onChange={vi.fn()} t={t} />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('adds a note as the signed-in editor', () => {
    const onChange = vi.fn();
    render(<EditorNotesPane notes={[]} onChange={onChange} user={{ login: 'alice' }} t={t} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Looks good  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'editor.editorNotesPane.addNote' }));

    expect(onChange).toHaveBeenCalledWith({
      action: 'ADD_NOTE',
      note: expect.objectContaining({ content: 'Looks good', author: 'alice', resolved: false }),
    });
  });

  it('resolves a note through an update', () => {
    const onChange = vi.fn();
    render(<EditorNotesPane notes={[note('1')]} onChange={onChange} user={{ login: 'alice' }} t={t} />);

    fireEvent.click(screen.getByRole('button', { name: 'editor.editorNotesPane.resolve' }));

    expect(onChange).toHaveBeenCalledWith({ action: 'UPDATE_NOTE', id: '1', updates: { resolved: true } });
  });
});
