import { fireEvent, render, screen } from '@testing-library/react';
import { fromJS, List } from 'immutable';

import EditorNotesPane from '../EditorNotesPane';

// Labels come from the translation key's last segment, so assertions read as
// the editor sees them rather than as `editor.editorNotesPane.*`.
function t(key) {
  return key.split('.').pop();
}

function note(overrides = {}) {
  return {
    id: '1',
    content: 'Should this mention the new pricing?',
    author: 'ada',
    timestamp: '2026-01-02T00:00:00Z',
    resolved: false,
    issueUrl: 'https://github.com/owner/repo/issues/7',
    ...overrides,
  };
}

/** React controlled inputs read the value off the event, so one change event
 *  is enough - no need for a per-keystroke library. */
function type(element, value) {
  fireEvent.change(element, { target: { value } });
}

function renderPane({ notes = [], user = { login: 'ada' }, onChange = jest.fn() } = {}) {
  render(
    <EditorNotesPane
      notes={List(notes.map(n => fromJS(n)))}
      onChange={onChange}
      entry={fromJS({ slug: 'my-post' })}
      collection={fromJS({ name: 'posts' })}
      user={user}
      t={t}
    />,
  );
  return { onChange };
}

describe('EditorNotesPane', () => {
  it('invites a first note when the entry has none', () => {
    renderPane();

    expect(screen.getByText('emptyState')).toBeInTheDocument();
  });

  it('shows the notes on the entry', () => {
    renderPane({ notes: [note(), note({ id: '2', content: 'Second thought' })] });

    expect(screen.getByText('Should this mention the new pricing?')).toBeInTheDocument();
    expect(screen.getByText('Second thought')).toBeInTheDocument();
    expect(screen.queryByText('emptyState')).not.toBeInTheDocument();
  });

  /**
   * The count is what an editor glances at to know whether anything still needs
   * their attention, so it counts what is unresolved - not how many notes exist.
   */
  it('counts what is still unresolved', () => {
    renderPane({
      notes: [note({ id: '1' }), note({ id: '2', resolved: true }), note({ id: '3' })],
    });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('falls back to the total once everything is resolved', () => {
    // Zero would read as "no notes here" when there are two worth reopening.
    renderPane({ notes: [note({ id: '1', resolved: true }), note({ id: '2', resolved: true })] });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('adds a note as the signed-in editor, trimmed', () => {
    const { onChange } = renderPane({ user: { login: 'ada' } });

    type(screen.getByPlaceholderText('addPlaceholder'), '   needs a source   ');
    fireEvent.click(screen.getByRole('button', { name: 'addNote' }));

    expect(onChange).toHaveBeenCalledWith('ADD_NOTE', {
      content: 'needs a source',
      author: 'ada',
      resolved: false,
    });
  });

  it('will not add an empty note', () => {
    const { onChange } = renderPane();

    type(screen.getByPlaceholderText('addPlaceholder'), '    ');
    expect(screen.getByRole('button', { name: 'addNote' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('resolves a note by flipping its current state', () => {
    const { onChange } = renderPane({ notes: [note({ id: 'n1', resolved: false })] });

    fireEvent.click(screen.getByRole('button', { name: 'resolve' }));

    expect(onChange).toHaveBeenCalledWith('UPDATE_NOTE', {
      id: 'n1',
      updates: { resolved: true },
    });
  });

  it('reopens a resolved note', () => {
    const { onChange } = renderPane({ notes: [note({ id: 'n1', resolved: true })] });

    fireEvent.click(screen.getByRole('button', { name: 'unresolve' }));

    expect(onChange).toHaveBeenCalledWith('UPDATE_NOTE', {
      id: 'n1',
      updates: { resolved: false },
    });
  });

  it('deletes a note once the editor confirms', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const { onChange } = renderPane({ notes: [note({ id: 'n1' })] });

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(onChange).toHaveBeenCalledWith('DELETE_NOTE', { id: 'n1' });
    window.confirm.mockRestore();
  });

  it('keeps a note the editor declines to delete', () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const { onChange } = renderPane({ notes: [note({ id: 'n1' })] });

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(onChange).not.toHaveBeenCalled();
    window.confirm.mockRestore();
  });

  it('puts unresolved notes above resolved ones', () => {
    renderPane({
      notes: [
        note({ id: '1', content: 'done with this', resolved: true }),
        note({ id: '2', content: 'still open', resolved: false }),
      ],
    });

    const shown = screen.getAllByText(/done with this|still open/).map(el => el.textContent);
    expect(shown).toEqual(['still open', 'done with this']);
  });

  describe('link back to the thread', () => {
    it('names the host it recognises', () => {
      renderPane({ notes: [note({ issueUrl: 'https://gitlab.com/o/r/-/issues/7' })] });

      expect(screen.getByRole('link')).toHaveTextContent('View in GitLab');
    });

    it('names a self-hosted host after the backend', () => {
      renderPane({
        notes: [note({ issueUrl: 'https://git.mycorp.io/o/r/-/issues/7' })],
        user: { login: 'ada', backendName: 'gitlab' },
      });

      expect(screen.getByRole('link')).toHaveTextContent('View in GitLab');
    });

    it('goes by the hostname for a backend that could front either host', () => {
      renderPane({
        notes: [note({ issueUrl: 'https://github.com/o/r/issues/7' })],
        user: { login: 'ada', backendName: 'git-gateway' },
      });

      expect(screen.getByRole('link')).toHaveTextContent('View in GitHub');
    });

    // A substring test would call this GitHub.
    it('does not name a host that merely contains the name', () => {
      renderPane({ notes: [note({ issueUrl: 'https://notgithub.com/o/r/issues/7' })] });

      expect(screen.getByRole('link')).toHaveTextContent('View source');
    });

    it('offers no link before the thread exists', () => {
      renderPane();

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
