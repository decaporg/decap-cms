import { fromJS } from 'immutable';

import { isNotesEnabled } from '../EditorInterface';

const entry = fromJS({ slug: 'my-post' });

function folderCollection(notes) {
  return fromJS({ name: 'posts', ...(notes === undefined ? {} : { editor: { notes } }) });
}

// Signature: (collection, entry, isNewEntry, isPublished, hasWorkflow)
function enabled(collection, { isNew = false, published = true, workflow = true } = {}) {
  return isNotesEnabled(collection, entry, isNew, published, workflow);
}

describe('isNotesEnabled', () => {
  it('is off unless a collection asks for it', () => {
    expect(enabled(folderCollection())).toBe(false);
    expect(enabled(folderCollection(true))).toBe(true);
  });

  /**
   * A note lives on a thread keyed to the entry, and an unsaved entry has no
   * identity to key one to yet.
   */
  it('is off while the entry is still unsaved', () => {
    expect(enabled(folderCollection(true), { isNew: true })).toBe(false);
  });

  // Notes are a review conversation; without the workflow there is no review.
  it('is off without the editorial workflow', () => {
    expect(enabled(folderCollection(true), { workflow: false })).toBe(false);
  });

  it('stays on after the entry is published', () => {
    // Publishing closes the thread but the conversation is still worth reading.
    expect(enabled(folderCollection(true), { published: true })).toBe(true);
  });

  describe('a file inside a files collection', () => {
    function filesCollection(collectionNotes, fileNotes) {
      return fromJS({
        name: 'general',
        type: 'file_based_collection',
        ...(collectionNotes === undefined ? {} : { editor: { notes: collectionNotes } }),
        files: [
          {
            name: 'settings',
            file: 'data/settings.json',
            ...(fileNotes === undefined ? {} : { editor: { notes: fileNotes } }),
          },
        ],
      });
    }

    const fileEntry = fromJS({ slug: 'settings' });

    function forFile(collection) {
      return isNotesEnabled(collection, fileEntry, false, true, true);
    }

    it('overrides the collection when the file says so', () => {
      expect(forFile(filesCollection(false, true))).toBe(true);
      expect(forFile(filesCollection(true, false))).toBe(false);
    });

    it('inherits the collection when the file is silent', () => {
      expect(forFile(filesCollection(true, undefined))).toBe(true);
      expect(forFile(filesCollection(false, undefined))).toBe(false);
    });
  });
});
