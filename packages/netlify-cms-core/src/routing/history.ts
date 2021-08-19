import { createHashHistory } from 'history';

const history = createHashHistory();

export function navigateToCollection(collectionName: string) {
  return history.push(`/collections/${collectionName}`);
}

export function navigateToNewEntry(collectionName: string) {
  return history.replace(`/collections/${collectionName}/new`);
}

export function navigateToEntry(collectionName: string, slug: string) {
  return history.replace(`/collections/${collectionName}/entries/${slug}`);
}

export { history };
