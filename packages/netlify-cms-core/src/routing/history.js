import { createHashHistory } from 'history';

const history = createHashHistory();

export const navigateToCollection = collectionName =>
  history.push(`/collections/${collectionName}`);
export const navigateToNewEntry = collectionName =>
  history.push(`/collections/${collectionName}/new`);
export const navigateToEntry = (collectionName, slug) =>
  history.replace(`/collections/${collectionName}/entries/${slug}`);

export default history;
