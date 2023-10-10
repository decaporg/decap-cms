"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNewEntry = createNewEntry;
exports.searchCollections = searchCollections;
exports.showCollection = showCollection;
var _history = require("../routing/history");
var _urlHelper = require("../lib/urlHelper");
function searchCollections(query, collection) {
  if (collection) {
    _history.history.push(`/collections/${collection}/search/${query}`);
  } else {
    _history.history.push(`/search/${query}`);
  }
}
function showCollection(collectionName) {
  _history.history.push((0, _urlHelper.getCollectionUrl)(collectionName));
}
function createNewEntry(collectionName) {
  _history.history.push((0, _urlHelper.getNewEntryUrl)(collectionName));
}