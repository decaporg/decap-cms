import { slugFormatter } from 'Lib/backendHelper';
import { selectEntryPath } from 'Reducers/collections';

export const selectDraftPath = (state, collection, entry) => {
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
