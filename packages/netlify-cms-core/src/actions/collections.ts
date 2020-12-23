import history from '../routing/history';
import { getCollectionUrl, getNewEntryUrl } from '../lib/urlHelper';

export function searchCollections(query: string, collection: string) {
  if (collection) {
    history.push(`/collections/${collection}/search/${query}`);
  } else {
    history.push(`/search/${query}`);
  }
}

export function showCollection(collectionName: string) {
  history.push(getCollectionUrl(collectionName));
}

export function createNewEntry(collectionName: string) {
  history.push(getNewEntryUrl(collectionName));
}
