import { createHashHistory } from 'history';

const history = createHashHistory();

export const navigateToCollection = (collectionName: string) =>
  history.push(`/collections/${collectionName}`);
export const navigateToNewEntry = (collectionName: string) =>
  history.replace(`/collections/${collectionName}/new`);
export const navigateToEntry = (collectionName: string, slug: string) =>
  history.replace(`/collections/${collectionName}/entries/${slug}`);

export default history;
