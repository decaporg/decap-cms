import history from 'Routing/history';
import { getCollectionUrl, getNewEntryUrl } from 'Lib/urlHelper';

export function searchCollections(query) {
  history.push(`/search/${query}`);
}

export function showCollection(collectionName) {
  history.push(getCollectionUrl(collectionName));
}

export function createNewEntry(collectionName) {
  history.push(getNewEntryUrl(collectionName));
}
