import { slugFormatter } from '../lib/backendHelper';
import { selectEntryPath } from '../reducers/collections';
import { State, Collection, EntryMap } from '../types/redux';

export const selectDraftPath = (state: State, collection: Collection, entry: EntryMap) => {
  const config = state.config;

  try {
    // slugFormatter throws in case an identifier is missing from the entry
    // we can safely ignore this error as this is just a preview path value
    const slug = slugFormatter(collection, entry.get('data'), config.get('slug'));
    return selectEntryPath(collection, slug);
  } catch (e) {
    return '';
  }
};
