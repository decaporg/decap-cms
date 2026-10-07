import { FILES } from '@/core/constants/collectionTypes';
import { getFileFromSlug } from '@/core/reducers/collections';

import type { CmsCollectionState } from '@/lib/util/index';

/**
 * Whether an entry shows the notes pane (decaporg #7563): the collection, or
 * for a files collection the entry's own file, sets `editor.notes`. Notes also
 * need the editorial workflow and a saved entry; callers check those.
 */
export function isNotesEnabled(collection: CmsCollectionState | undefined, slug: string | undefined): boolean {
  if (!collection) {
    return false;
  }
  if (collection.type === FILES && slug) {
    const fileNotes = (getFileFromSlug(collection, slug) as { editor?: { notes?: boolean } } | undefined)
      ?.editor?.notes;
    if (fileNotes != null) {
      return fileNotes;
    }
  }
  return !!(collection.editor as { notes?: boolean } | undefined)?.notes;
}
