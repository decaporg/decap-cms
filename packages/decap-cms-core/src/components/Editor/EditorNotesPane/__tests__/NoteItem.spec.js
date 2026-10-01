import { fireEvent, render, screen } from '@testing-library/react';
import { fromJS } from 'immutable';

import NoteItem from '../NoteItem';

function t(key) {
  return key.split('.').pop();
}

function renderNote(note, { user = { login: 'ada' }, ...handlers } = {}) {
  const props = {
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onToggleResolution: jest.fn(),
    ...handlers,
  };
  render(
    <NoteItem
      note={fromJS({
        id: 'n1',
        content: 'Should this mention the new pricing?',
        author: 'ada',
        timestamp: '2026-01-02T00:00:00Z',
        resolved: false,
        ...note,
      })}
      user={user}
      t={t}
      {...props}
    />,
  );
  return props;
}

function actions() {
  return {
    edit: screen.queryByRole('button', { name: 'edit' }),
    resolve: screen.queryByRole('button', { name: /^(resolve|unresolve)$/ }),
    delete: screen.queryByRole('button', { name: 'delete' }),
  };
}

describe('NoteItem', () => {
  it('shows the note, who wrote it and when', () => {
    renderNote({ author: 'Ada Lovelace' });

    expect(screen.getByText('Should this mention the new pricing?')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  /**
   * Ownership is the whole point of the action buttons: an editor may act on
   * their own note and no one else's.
   */
  describe('who may act on a note', () => {
    it('lets the editor act on their own note', () => {
      renderNote({ author: 'ada' }, { user: { login: 'ada' } });

      const { edit, resolve, delete: del } = actions();
      expect(edit).toBeEnabled();
      expect(resolve).toBeEnabled();
      expect(del).toBeEnabled();
    });

    it('locks a note written by someone else', () => {
      renderNote({ author: 'grace' }, { user: { login: 'ada' } });

      const { edit, resolve, delete: del } = actions();
      expect(edit).toBeDisabled();
      expect(resolve).toBeDisabled();
      expect(del).toBeDisabled();
    });

    /**
     * On a backend that posts through a shared app the comment author is the
     * app, so comparing names names nobody. The backend answers instead.
     */
    it('trusts the backend over the author name when it has an answer', () => {
      renderNote(
        { author: 'decap-turbo[bot]', isOwn: true },
        { user: { login: 'poslovnimediji' } },
      );

      expect(actions().delete).toBeEnabled();
    });

    it('trusts the backend when it says the note is not the editor’s', () => {
      // Names match, but the backend knows better.
      renderNote({ author: 'ada', isOwn: false }, { user: { login: 'ada' } });

      expect(actions().delete).toBeDisabled();
    });

    it('falls back to the author name when the backend has no answer', () => {
      renderNote({ author: 'ada' }, { user: { login: 'ada' } });

      expect(actions().delete).toBeEnabled();
    });

    it('matches on display name when there is no login', () => {
      renderNote({ author: 'Ada Lovelace' }, { user: { name: 'Ada Lovelace' } });

      expect(actions().delete).toBeEnabled();
    });
  });

  describe('a resolved note', () => {
    it('is marked resolved and offers to reopen rather than edit', () => {
      renderNote({ resolved: true });

      expect(screen.getByText('resolved')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'unresolve' })).toBeInTheDocument();
      // Editing a settled note would change what was agreed after the fact.
      expect(actions().edit).not.toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('saves the edited content, trimmed', () => {
      const { onUpdate } = renderNote({ content: 'original' });

      fireEvent.click(screen.getByRole('button', { name: 'edit' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '  revised  ' } });
      fireEvent.click(screen.getByRole('button', { name: 'save' }));

      expect(onUpdate).toHaveBeenCalledWith('n1', { content: 'revised' });
    });

    it('does not report an edit that changed nothing', () => {
      const { onUpdate } = renderNote({ content: 'original' });

      fireEvent.click(screen.getByRole('button', { name: 'edit' }));
      fireEvent.click(screen.getByRole('button', { name: 'save' }));

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('discards the edit on cancel', () => {
      const { onUpdate } = renderNote({ content: 'original' });

      fireEvent.click(screen.getByRole('button', { name: 'edit' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'original and more' } });
      fireEvent.click(screen.getByRole('button', { name: 'cancel' }));

      expect(onUpdate).not.toHaveBeenCalled();
      expect(screen.getByText('original')).toBeInTheDocument();
    });
  });

  it('asks before deleting, since a note cannot be recovered', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const { onDelete } = renderNote();

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    window.confirm.mockRestore();
  });
});
