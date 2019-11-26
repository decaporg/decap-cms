import { slugFormatter } from 'Lib/backendHelper';

export const selectDraftPath = (state, collection, entry) => {
  const config = state.config;

  try {
    // slugFormatter throws in case an identifier is missing from the entry
    // we can safely ignore this error as this is just a preview path value
    return slugFormatter(collection, entry.get('data'), config.get('slug'));
  } catch (e) {
    return '';
  }
};
