"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.history = void 0;
exports.navigateToCollection = navigateToCollection;
exports.navigateToEntry = navigateToEntry;
exports.navigateToNewEntry = navigateToNewEntry;
var _history = require("history");
const history = (0, _history.createHashHistory)();
exports.history = history;
function navigateToCollection(collectionName) {
  return history.push(`/collections/${collectionName}`);
}
function navigateToNewEntry(collectionName) {
  return history.replace(`/collections/${collectionName}/new`);
}
function navigateToEntry(collectionName, slug) {
  return history.replace(`/collections/${collectionName}/entries/${slug}`);
}