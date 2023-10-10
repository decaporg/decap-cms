"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _immer = require("immer");
var _search = require("../actions/search");
const defaultState = {
  isFetching: false,
  term: '',
  collections: [],
  page: 0,
  entryIds: [],
  queryHits: {},
  error: undefined,
  requests: []
};
const search = (0, _immer.produce)((state, action) => {
  switch (action.type) {
    case _search.SEARCH_CLEAR:
      return defaultState;
    case _search.SEARCH_ENTRIES_REQUEST:
      {
        const {
          page,
          searchTerm,
          searchCollections
        } = action.payload;
        state.isFetching = true;
        state.term = searchTerm;
        state.collections = searchCollections;
        state.page = page;
        break;
      }
    case _search.SEARCH_ENTRIES_SUCCESS:
      {
        const {
          entries,
          page
        } = action.payload;
        const entryIds = entries.map(entry => ({
          collection: entry.collection,
          slug: entry.slug
        }));
        state.isFetching = false;
        state.page = page;
        state.entryIds = !page || isNaN(page) || page === 0 ? entryIds : state.entryIds.concat(entryIds);
        break;
      }
    case _search.SEARCH_ENTRIES_FAILURE:
      {
        const {
          error
        } = action.payload;
        state.isFetching = false;
        state.error = error;
        break;
      }
    case _search.QUERY_REQUEST:
      {
        const {
          searchTerm,
          request
        } = action.payload;
        state.isFetching = true;
        state.term = searchTerm;
        if (request) {
          state.requests.push(request);
        }
        break;
      }
    case _search.CLEAR_REQUESTS:
      {
        state.requests = state.requests.filter(req => req.expires >= new Date());
        break;
      }
    case _search.QUERY_SUCCESS:
      {
        const {
          namespace,
          hits
        } = action.payload;
        state.isFetching = false;
        state.queryHits[namespace] = hits;
        break;
      }
    case _search.QUERY_FAILURE:
      {
        const {
          error
        } = action.payload;
        state.isFetching = false;
        state.error = error;
      }
  }
}, defaultState);
var _default = search;
exports.default = _default;