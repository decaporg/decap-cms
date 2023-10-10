"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _reactPolyglot = require("react-polyglot");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _EntryListing = _interopRequireDefault(require("./EntryListing"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const PaginationMessage = (0, _styledBase.default)("div", {
  target: "e1d0i3na0",
  label: "PaginationMessage"
})("width:", _decapCmsUiDefault.lengths.topCardWidth, ";padding:16px;text-align:center;" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyaWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNvQyIsImZpbGUiOiIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Db2xsZWN0aW9uL0VudHJpZXMvRW50cmllcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IEltbXV0YWJsZVByb3BUeXBlcyBmcm9tICdyZWFjdC1pbW11dGFibGUtcHJvcHR5cGVzJztcbmltcG9ydCB7IHRyYW5zbGF0ZSB9IGZyb20gJ3JlYWN0LXBvbHlnbG90JztcbmltcG9ydCB7IExvYWRlciwgbGVuZ3RocyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuaW1wb3J0IEVudHJ5TGlzdGluZyBmcm9tICcuL0VudHJ5TGlzdGluZyc7XG5cbmNvbnN0IFBhZ2luYXRpb25NZXNzYWdlID0gc3R5bGVkLmRpdmBcbiAgd2lkdGg6ICR7bGVuZ3Rocy50b3BDYXJkV2lkdGh9O1xuICBwYWRkaW5nOiAxNnB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5gO1xuXG5jb25zdCBOb0VudHJpZXNNZXNzYWdlID0gc3R5bGVkKFBhZ2luYXRpb25NZXNzYWdlKWBcbiAgbWFyZ2luLXRvcDogMTZweDtcbmA7XG5cbmZ1bmN0aW9uIEVudHJpZXMoe1xuICBjb2xsZWN0aW9ucyxcbiAgZW50cmllcyxcbiAgaXNGZXRjaGluZyxcbiAgdmlld1N0eWxlLFxuICBjdXJzb3IsXG4gIGhhbmRsZUN1cnNvckFjdGlvbnMsXG4gIHQsXG4gIHBhZ2UsXG59KSB7XG4gIGNvbnN0IGxvYWRpbmdNZXNzYWdlcyA9IFtcbiAgICB0KCdjb2xsZWN0aW9uLmVudHJpZXMubG9hZGluZ0VudHJpZXMnKSxcbiAgICB0KCdjb2xsZWN0aW9uLmVudHJpZXMuY2FjaGluZ0VudHJpZXMnKSxcbiAgICB0KCdjb2xsZWN0aW9uLmVudHJpZXMubG9uZ2VyTG9hZGluZycpLFxuICBdO1xuXG4gIGlmIChpc0ZldGNoaW5nICYmIHBhZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiA8TG9hZGVyIGFjdGl2ZT57bG9hZGluZ01lc3NhZ2VzfTwvTG9hZGVyPjtcbiAgfVxuXG4gIGNvbnN0IGhhc0VudHJpZXMgPSAoZW50cmllcyAmJiBlbnRyaWVzLnNpemUgPiAwKSB8fCBjdXJzb3I/LmFjdGlvbnM/LmhhcygnYXBwZW5kX25leHQnKTtcbiAgaWYgKGhhc0VudHJpZXMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPEVudHJ5TGlzdGluZ1xuICAgICAgICAgIGNvbGxlY3Rpb25zPXtjb2xsZWN0aW9uc31cbiAgICAgICAgICBlbnRyaWVzPXtlbnRyaWVzfVxuICAgICAgICAgIHZpZXdTdHlsZT17dmlld1N0eWxlfVxuICAgICAgICAgIGN1cnNvcj17Y3Vyc29yfVxuICAgICAgICAgIGhhbmRsZUN1cnNvckFjdGlvbnM9e2hhbmRsZUN1cnNvckFjdGlvbnN9XG4gICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgLz5cbiAgICAgICAge2lzRmV0Y2hpbmcgJiYgcGFnZSAhPT0gdW5kZWZpbmVkICYmIGVudHJpZXMuc2l6ZSA+IDAgPyAoXG4gICAgICAgICAgPFBhZ2luYXRpb25NZXNzYWdlPnt0KCdjb2xsZWN0aW9uLmVudHJpZXMubG9hZGluZ0VudHJpZXMnKX08L1BhZ2luYXRpb25NZXNzYWdlPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gPE5vRW50cmllc01lc3NhZ2U+e3QoJ2NvbGxlY3Rpb24uZW50cmllcy5ub0VudHJpZXMnKX08L05vRW50cmllc01lc3NhZ2U+O1xufVxuXG5FbnRyaWVzLnByb3BUeXBlcyA9IHtcbiAgY29sbGVjdGlvbnM6IEltbXV0YWJsZVByb3BUeXBlcy5pdGVyYWJsZS5pc1JlcXVpcmVkLFxuICBlbnRyaWVzOiBJbW11dGFibGVQcm9wVHlwZXMubGlzdCxcbiAgcGFnZTogUHJvcFR5cGVzLm51bWJlcixcbiAgaXNGZXRjaGluZzogUHJvcFR5cGVzLmJvb2wsXG4gIHZpZXdTdHlsZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgY3Vyc29yOiBQcm9wVHlwZXMuYW55LmlzUmVxdWlyZWQsXG4gIGhhbmRsZUN1cnNvckFjdGlvbnM6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG59O1xuXG5leHBvcnQgZGVmYXVsdCB0cmFuc2xhdGUoKShFbnRyaWVzKTtcbiJdfQ== */"));
const NoEntriesMessage = ( /*#__PURE__*/0, _styledBase.default)(PaginationMessage, {
  target: "e1d0i3na1",
  label: "NoEntriesMessage"
})(process.env.NODE_ENV === "production" ? {
  name: "1yuhvjn",
  styles: "margin-top:16px;"
} : {
  name: "1yuhvjn",
  styles: "margin-top:16px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyaWVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWVrRCIsImZpbGUiOiIuLi8uLi8uLi8uLi8uLi9zcmMvY29tcG9uZW50cy9Db2xsZWN0aW9uL0VudHJpZXMvRW50cmllcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9wVHlwZXMgZnJvbSAncHJvcC10eXBlcyc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IEltbXV0YWJsZVByb3BUeXBlcyBmcm9tICdyZWFjdC1pbW11dGFibGUtcHJvcHR5cGVzJztcbmltcG9ydCB7IHRyYW5zbGF0ZSB9IGZyb20gJ3JlYWN0LXBvbHlnbG90JztcbmltcG9ydCB7IExvYWRlciwgbGVuZ3RocyB9IGZyb20gJ2RlY2FwLWNtcy11aS1kZWZhdWx0JztcblxuaW1wb3J0IEVudHJ5TGlzdGluZyBmcm9tICcuL0VudHJ5TGlzdGluZyc7XG5cbmNvbnN0IFBhZ2luYXRpb25NZXNzYWdlID0gc3R5bGVkLmRpdmBcbiAgd2lkdGg6ICR7bGVuZ3Rocy50b3BDYXJkV2lkdGh9O1xuICBwYWRkaW5nOiAxNnB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG5gO1xuXG5jb25zdCBOb0VudHJpZXNNZXNzYWdlID0gc3R5bGVkKFBhZ2luYXRpb25NZXNzYWdlKWBcbiAgbWFyZ2luLXRvcDogMTZweDtcbmA7XG5cbmZ1bmN0aW9uIEVudHJpZXMoe1xuICBjb2xsZWN0aW9ucyxcbiAgZW50cmllcyxcbiAgaXNGZXRjaGluZyxcbiAgdmlld1N0eWxlLFxuICBjdXJzb3IsXG4gIGhhbmRsZUN1cnNvckFjdGlvbnMsXG4gIHQsXG4gIHBhZ2UsXG59KSB7XG4gIGNvbnN0IGxvYWRpbmdNZXNzYWdlcyA9IFtcbiAgICB0KCdjb2xsZWN0aW9uLmVudHJpZXMubG9hZGluZ0VudHJpZXMnKSxcbiAgICB0KCdjb2xsZWN0aW9uLmVudHJpZXMuY2FjaGluZ0VudHJpZXMnKSxcbiAgICB0KCdjb2xsZWN0aW9uLmVudHJpZXMubG9uZ2VyTG9hZGluZycpLFxuICBdO1xuXG4gIGlmIChpc0ZldGNoaW5nICYmIHBhZ2UgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiA8TG9hZGVyIGFjdGl2ZT57bG9hZGluZ01lc3NhZ2VzfTwvTG9hZGVyPjtcbiAgfVxuXG4gIGNvbnN0IGhhc0VudHJpZXMgPSAoZW50cmllcyAmJiBlbnRyaWVzLnNpemUgPiAwKSB8fCBjdXJzb3I/LmFjdGlvbnM/LmhhcygnYXBwZW5kX25leHQnKTtcbiAgaWYgKGhhc0VudHJpZXMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPEVudHJ5TGlzdGluZ1xuICAgICAgICAgIGNvbGxlY3Rpb25zPXtjb2xsZWN0aW9uc31cbiAgICAgICAgICBlbnRyaWVzPXtlbnRyaWVzfVxuICAgICAgICAgIHZpZXdTdHlsZT17dmlld1N0eWxlfVxuICAgICAgICAgIGN1cnNvcj17Y3Vyc29yfVxuICAgICAgICAgIGhhbmRsZUN1cnNvckFjdGlvbnM9e2hhbmRsZUN1cnNvckFjdGlvbnN9XG4gICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgLz5cbiAgICAgICAge2lzRmV0Y2hpbmcgJiYgcGFnZSAhPT0gdW5kZWZpbmVkICYmIGVudHJpZXMuc2l6ZSA+IDAgPyAoXG4gICAgICAgICAgPFBhZ2luYXRpb25NZXNzYWdlPnt0KCdjb2xsZWN0aW9uLmVudHJpZXMubG9hZGluZ0VudHJpZXMnKX08L1BhZ2luYXRpb25NZXNzYWdlPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gPE5vRW50cmllc01lc3NhZ2U+e3QoJ2NvbGxlY3Rpb24uZW50cmllcy5ub0VudHJpZXMnKX08L05vRW50cmllc01lc3NhZ2U+O1xufVxuXG5FbnRyaWVzLnByb3BUeXBlcyA9IHtcbiAgY29sbGVjdGlvbnM6IEltbXV0YWJsZVByb3BUeXBlcy5pdGVyYWJsZS5pc1JlcXVpcmVkLFxuICBlbnRyaWVzOiBJbW11dGFibGVQcm9wVHlwZXMubGlzdCxcbiAgcGFnZTogUHJvcFR5cGVzLm51bWJlcixcbiAgaXNGZXRjaGluZzogUHJvcFR5cGVzLmJvb2wsXG4gIHZpZXdTdHlsZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgY3Vyc29yOiBQcm9wVHlwZXMuYW55LmlzUmVxdWlyZWQsXG4gIGhhbmRsZUN1cnNvckFjdGlvbnM6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIHQ6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG59O1xuXG5leHBvcnQgZGVmYXVsdCB0cmFuc2xhdGUoKShFbnRyaWVzKTtcbiJdfQ== */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
function Entries({
  collections,
  entries,
  isFetching,
  viewStyle,
  cursor,
  handleCursorActions,
  t,
  page
}) {
  var _cursor$actions;
  const loadingMessages = [t('collection.entries.loadingEntries'), t('collection.entries.cachingEntries'), t('collection.entries.longerLoading')];
  if (isFetching && page === undefined) {
    return (0, _core.jsx)(_decapCmsUiDefault.Loader, {
      active: true
    }, loadingMessages);
  }
  const hasEntries = entries && entries.size > 0 || (cursor === null || cursor === void 0 ? void 0 : (_cursor$actions = cursor.actions) === null || _cursor$actions === void 0 ? void 0 : _cursor$actions.has('append_next'));
  if (hasEntries) {
    return (0, _core.jsx)(_react.default.Fragment, null, (0, _core.jsx)(_EntryListing.default, {
      collections: collections,
      entries: entries,
      viewStyle: viewStyle,
      cursor: cursor,
      handleCursorActions: handleCursorActions,
      page: page
    }), isFetching && page !== undefined && entries.size > 0 ? (0, _core.jsx)(PaginationMessage, null, t('collection.entries.loadingEntries')) : null);
  }
  return (0, _core.jsx)(NoEntriesMessage, null, t('collection.entries.noEntries'));
}
Entries.propTypes = {
  collections: _reactImmutableProptypes.default.iterable.isRequired,
  entries: _reactImmutableProptypes.default.list,
  page: _propTypes.default.number,
  isFetching: _propTypes.default.bool,
  viewStyle: _propTypes.default.string,
  cursor: _propTypes.default.any.isRequired,
  handleCursorActions: _propTypes.default.func.isRequired,
  t: _propTypes.default.func.isRequired
};
var _default = (0, _reactPolyglot.translate)()(Entries);
exports.default = _default;