"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fileShape = exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _isEmpty2 = _interopRequireDefault(require("lodash/isEmpty"));
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _immutable = require("immutable");
var _reactPolyglot = require("react-polyglot");
var _decapCmsUiDefault = require("decap-cms-ui-default");
var _UI = require("../UI");
var _MediaLibraryTop = _interopRequireDefault(require("./MediaLibraryTop"));
var _MediaLibraryCardGrid = _interopRequireDefault(require("./MediaLibraryCardGrid"));
var _EmptyMessage = _interopRequireDefault(require("./EmptyMessage"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Responsive styling needs to be overhauled. Current setup requires specifying
 * widths per breakpoint.
 */const cardWidth = `280px`;
const cardHeight = `240px`;
const cardMargin = `10px`;

/**
 * cardWidth + cardMargin * 2 = cardOutsideWidth
 * (not using calc because this will be nested in other calcs)
 */
const cardOutsideWidth = `300px`;
const StyledModal = ( /*#__PURE__*/0, _styledBase.default)(_UI.Modal, {
  target: "e4d0svf0",
  label: "StyledModal"
})("display:grid;grid-template-rows:120px auto;width:calc(", cardOutsideWidth, " + 20px);background-color:", props => props.isPrivate && _decapCmsUiDefault.colors.grayDark, ";@media (min-width:800px){width:calc(", cardOutsideWidth, " * 2 + 20px);}@media (min-width:1120px){width:calc(", cardOutsideWidth, " * 3 + 20px);}@media (min-width:1440px){width:calc(", cardOutsideWidth, " * 4 + 20px);}@media (min-width:1760px){width:calc(", cardOutsideWidth, " * 5 + 20px);}@media (min-width:2080px){width:calc(", cardOutsideWidth, " * 6 + 20px);}h1{color:", props => props.isPrivate && _decapCmsUiDefault.colors.textFieldBorder, ";}button:disabled,label[disabled]{background-color:", props => props.isPrivate && `rgba(217, 217, 217, 0.15)`, ";}" + (process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL01lZGlhTGlicmFyeS9NZWRpYUxpYnJhcnlNb2RhbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEyQmlDIiwiZmlsZSI6Ii4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL01lZGlhTGlicmFyeS9NZWRpYUxpYnJhcnlNb2RhbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IHN0eWxlZCBmcm9tICdAZW1vdGlvbi9zdHlsZWQnO1xuaW1wb3J0IHsgTWFwIH0gZnJvbSAnaW1tdXRhYmxlJztcbmltcG9ydCB7IGlzRW1wdHkgfSBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHsgdHJhbnNsYXRlIH0gZnJvbSAncmVhY3QtcG9seWdsb3QnO1xuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnZGVjYXAtY21zLXVpLWRlZmF1bHQnO1xuXG5pbXBvcnQgeyBNb2RhbCB9IGZyb20gJy4uL1VJJztcbmltcG9ydCBNZWRpYUxpYnJhcnlUb3AgZnJvbSAnLi9NZWRpYUxpYnJhcnlUb3AnO1xuaW1wb3J0IE1lZGlhTGlicmFyeUNhcmRHcmlkIGZyb20gJy4vTWVkaWFMaWJyYXJ5Q2FyZEdyaWQnO1xuaW1wb3J0IEVtcHR5TWVzc2FnZSBmcm9tICcuL0VtcHR5TWVzc2FnZSc7XG5cbi8qKlxuICogUmVzcG9uc2l2ZSBzdHlsaW5nIG5lZWRzIHRvIGJlIG92ZXJoYXVsZWQuIEN1cnJlbnQgc2V0dXAgcmVxdWlyZXMgc3BlY2lmeWluZ1xuICogd2lkdGhzIHBlciBicmVha3BvaW50LlxuICovXG5jb25zdCBjYXJkV2lkdGggPSBgMjgwcHhgO1xuY29uc3QgY2FyZEhlaWdodCA9IGAyNDBweGA7XG5jb25zdCBjYXJkTWFyZ2luID0gYDEwcHhgO1xuXG4vKipcbiAqIGNhcmRXaWR0aCArIGNhcmRNYXJnaW4gKiAyID0gY2FyZE91dHNpZGVXaWR0aFxuICogKG5vdCB1c2luZyBjYWxjIGJlY2F1c2UgdGhpcyB3aWxsIGJlIG5lc3RlZCBpbiBvdGhlciBjYWxjcylcbiAqL1xuY29uc3QgY2FyZE91dHNpZGVXaWR0aCA9IGAzMDBweGA7XG5cbmNvbnN0IFN0eWxlZE1vZGFsID0gc3R5bGVkKE1vZGFsKWBcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiAxMjBweCBhdXRvO1xuICB3aWR0aDogY2FsYygke2NhcmRPdXRzaWRlV2lkdGh9ICsgMjBweCk7XG4gIGJhY2tncm91bmQtY29sb3I6ICR7cHJvcHMgPT4gcHJvcHMuaXNQcml2YXRlICYmIGNvbG9ycy5ncmF5RGFya307XG5cbiAgQG1lZGlhIChtaW4td2lkdGg6IDgwMHB4KSB7XG4gICAgd2lkdGg6IGNhbGMoJHtjYXJkT3V0c2lkZVdpZHRofSAqIDIgKyAyMHB4KTtcbiAgfVxuXG4gIEBtZWRpYSAobWluLXdpZHRoOiAxMTIwcHgpIHtcbiAgICB3aWR0aDogY2FsYygke2NhcmRPdXRzaWRlV2lkdGh9ICogMyArIDIwcHgpO1xuICB9XG5cbiAgQG1lZGlhIChtaW4td2lkdGg6IDE0NDBweCkge1xuICAgIHdpZHRoOiBjYWxjKCR7Y2FyZE91dHNpZGVXaWR0aH0gKiA0ICsgMjBweCk7XG4gIH1cblxuICBAbWVkaWEgKG1pbi13aWR0aDogMTc2MHB4KSB7XG4gICAgd2lkdGg6IGNhbGMoJHtjYXJkT3V0c2lkZVdpZHRofSAqIDUgKyAyMHB4KTtcbiAgfVxuXG4gIEBtZWRpYSAobWluLXdpZHRoOiAyMDgwcHgpIHtcbiAgICB3aWR0aDogY2FsYygke2NhcmRPdXRzaWRlV2lkdGh9ICogNiArIDIwcHgpO1xuICB9XG5cbiAgaDEge1xuICAgIGNvbG9yOiAke3Byb3BzID0+IHByb3BzLmlzUHJpdmF0ZSAmJiBjb2xvcnMudGV4dEZpZWxkQm9yZGVyfTtcbiAgfVxuXG4gIGJ1dHRvbjpkaXNhYmxlZCxcbiAgbGFiZWxbZGlzYWJsZWRdIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAke3Byb3BzID0+IHByb3BzLmlzUHJpdmF0ZSAmJiBgcmdiYSgyMTcsIDIxNywgMjE3LCAwLjE1KWB9O1xuICB9XG5gO1xuXG5mdW5jdGlvbiBNZWRpYUxpYnJhcnlNb2RhbCh7XG4gIGlzVmlzaWJsZSxcbiAgY2FuSW5zZXJ0LFxuICBmaWxlcyxcbiAgZHluYW1pY1NlYXJjaCxcbiAgZHluYW1pY1NlYXJjaEFjdGl2ZSxcbiAgZm9ySW1hZ2UsXG4gIGlzTG9hZGluZyxcbiAgaXNQZXJzaXN0aW5nLFxuICBpc0RlbGV0aW5nLFxuICBoYXNOZXh0UGFnZSxcbiAgaXNQYWdpbmF0aW5nLFxuICBwcml2YXRlVXBsb2FkLFxuICBxdWVyeSxcbiAgc2VsZWN0ZWRGaWxlLFxuICBoYW5kbGVGaWx0ZXIsXG4gIGhhbmRsZVF1ZXJ5LFxuICB0b1RhYmxlRGF0YSxcbiAgaGFuZGxlQ2xvc2UsXG4gIGhhbmRsZVNlYXJjaENoYW5nZSxcbiAgaGFuZGxlU2VhcmNoS2V5RG93bixcbiAgaGFuZGxlUGVyc2lzdCxcbiAgaGFuZGxlRGVsZXRlLFxuICBoYW5kbGVJbnNlcnQsXG4gIGhhbmRsZURvd25sb2FkLFxuICBzZXRTY3JvbGxDb250YWluZXJSZWYsXG4gIGhhbmRsZUFzc2V0Q2xpY2ssXG4gIGhhbmRsZUxvYWRNb3JlLFxuICBsb2FkRGlzcGxheVVSTCxcbiAgZGlzcGxheVVSTHMsXG4gIHQsXG59KSB7XG4gIGNvbnN0IGZpbHRlcmVkRmlsZXMgPSBmb3JJbWFnZSA/IGhhbmRsZUZpbHRlcihmaWxlcykgOiBmaWxlcztcbiAgY29uc3QgcXVlcmllZEZpbGVzID0gIWR5bmFtaWNTZWFyY2ggJiYgcXVlcnkgPyBoYW5kbGVRdWVyeShxdWVyeSwgZmlsdGVyZWRGaWxlcykgOiBmaWx0ZXJlZEZpbGVzO1xuICBjb25zdCB0YWJsZURhdGEgPSB0b1RhYmxlRGF0YShxdWVyaWVkRmlsZXMpO1xuICBjb25zdCBoYXNGaWxlcyA9IGZpbGVzICYmICEhZmlsZXMubGVuZ3RoO1xuICBjb25zdCBoYXNGaWx0ZXJlZEZpbGVzID0gZmlsdGVyZWRGaWxlcyAmJiAhIWZpbHRlcmVkRmlsZXMubGVuZ3RoO1xuICBjb25zdCBoYXNTZWFyY2hSZXN1bHRzID0gcXVlcmllZEZpbGVzICYmICEhcXVlcmllZEZpbGVzLmxlbmd0aDtcbiAgY29uc3QgaGFzTWVkaWEgPSBoYXNTZWFyY2hSZXN1bHRzO1xuICBjb25zdCBzaG91bGRTaG93RW1wdHlNZXNzYWdlID0gIWhhc01lZGlhO1xuICBjb25zdCBlbXB0eU1lc3NhZ2UgPVxuICAgIChpc0xvYWRpbmcgJiYgIWhhc01lZGlhICYmIHQoJ21lZGlhTGlicmFyeS5tZWRpYUxpYnJhcnlNb2RhbC5sb2FkaW5nJykpIHx8XG4gICAgKGR5bmFtaWNTZWFyY2hBY3RpdmUgJiYgdCgnbWVkaWFMaWJyYXJ5Lm1lZGlhTGlicmFyeU1vZGFsLm5vUmVzdWx0cycpKSB8fFxuICAgICghaGFzRmlsZXMgJiYgdCgnbWVkaWFMaWJyYXJ5Lm1lZGlhTGlicmFyeU1vZGFsLm5vQXNzZXRzRm91bmQnKSkgfHxcbiAgICAoIWhhc0ZpbHRlcmVkRmlsZXMgJiYgdCgnbWVkaWFMaWJyYXJ5Lm1lZGlhTGlicmFyeU1vZGFsLm5vSW1hZ2VzRm91bmQnKSkgfHxcbiAgICAoIWhhc1NlYXJjaFJlc3VsdHMgJiYgdCgnbWVkaWFMaWJyYXJ5Lm1lZGlhTGlicmFyeU1vZGFsLm5vUmVzdWx0cycpKTtcblxuICBjb25zdCBoYXNTZWxlY3Rpb24gPSBoYXNNZWRpYSAmJiAhaXNFbXB0eShzZWxlY3RlZEZpbGUpO1xuXG4gIHJldHVybiAoXG4gICAgPFN0eWxlZE1vZGFsIGlzT3Blbj17aXNWaXNpYmxlfSBvbkNsb3NlPXtoYW5kbGVDbG9zZX0gaXNQcml2YXRlPXtwcml2YXRlVXBsb2FkfT5cbiAgICAgIDxNZWRpYUxpYnJhcnlUb3BcbiAgICAgICAgdD17dH1cbiAgICAgICAgb25DbG9zZT17aGFuZGxlQ2xvc2V9XG4gICAgICAgIHByaXZhdGVVcGxvYWQ9e3ByaXZhdGVVcGxvYWR9XG4gICAgICAgIGZvckltYWdlPXtmb3JJbWFnZX1cbiAgICAgICAgb25Eb3dubG9hZD17aGFuZGxlRG93bmxvYWR9XG4gICAgICAgIG9uVXBsb2FkPXtoYW5kbGVQZXJzaXN0fVxuICAgICAgICBxdWVyeT17cXVlcnl9XG4gICAgICAgIG9uU2VhcmNoQ2hhbmdlPXtoYW5kbGVTZWFyY2hDaGFuZ2V9XG4gICAgICAgIG9uU2VhcmNoS2V5RG93bj17aGFuZGxlU2VhcmNoS2V5RG93bn1cbiAgICAgICAgc2VhcmNoRGlzYWJsZWQ9eyFkeW5hbWljU2VhcmNoQWN0aXZlICYmICFoYXNGaWx0ZXJlZEZpbGVzfVxuICAgICAgICBvbkRlbGV0ZT17aGFuZGxlRGVsZXRlfVxuICAgICAgICBjYW5JbnNlcnQ9e2Nhbkluc2VydH1cbiAgICAgICAgb25JbnNlcnQ9e2hhbmRsZUluc2VydH1cbiAgICAgICAgaGFzU2VsZWN0aW9uPXtoYXNTZWxlY3Rpb259XG4gICAgICAgIGlzUGVyc2lzdGluZz17aXNQZXJzaXN0aW5nfVxuICAgICAgICBpc0RlbGV0aW5nPXtpc0RlbGV0aW5nfVxuICAgICAgICBzZWxlY3RlZEZpbGU9e3NlbGVjdGVkRmlsZX1cbiAgICAgIC8+XG4gICAgICB7IXNob3VsZFNob3dFbXB0eU1lc3NhZ2UgPyBudWxsIDogKFxuICAgICAgICA8RW1wdHlNZXNzYWdlIGNvbnRlbnQ9e2VtcHR5TWVzc2FnZX0gaXNQcml2YXRlPXtwcml2YXRlVXBsb2FkfSAvPlxuICAgICAgKX1cbiAgICAgIDxNZWRpYUxpYnJhcnlDYXJkR3JpZFxuICAgICAgICBzZXRTY3JvbGxDb250YWluZXJSZWY9e3NldFNjcm9sbENvbnRhaW5lclJlZn1cbiAgICAgICAgbWVkaWFJdGVtcz17dGFibGVEYXRhfVxuICAgICAgICBpc1NlbGVjdGVkRmlsZT17ZmlsZSA9PiBzZWxlY3RlZEZpbGUua2V5ID09PSBmaWxlLmtleX1cbiAgICAgICAgb25Bc3NldENsaWNrPXtoYW5kbGVBc3NldENsaWNrfVxuICAgICAgICBjYW5Mb2FkTW9yZT17aGFzTmV4dFBhZ2V9XG4gICAgICAgIG9uTG9hZE1vcmU9e2hhbmRsZUxvYWRNb3JlfVxuICAgICAgICBpc1BhZ2luYXRpbmc9e2lzUGFnaW5hdGluZ31cbiAgICAgICAgcGFnaW5hdGluZ01lc3NhZ2U9e3QoJ21lZGlhTGlicmFyeS5tZWRpYUxpYnJhcnlNb2RhbC5sb2FkaW5nJyl9XG4gICAgICAgIGNhcmREcmFmdFRleHQ9e3QoJ21lZGlhTGlicmFyeS5tZWRpYUxpYnJhcnlDYXJkLmRyYWZ0Jyl9XG4gICAgICAgIGNhcmRXaWR0aD17Y2FyZFdpZHRofVxuICAgICAgICBjYXJkSGVpZ2h0PXtjYXJkSGVpZ2h0fVxuICAgICAgICBjYXJkTWFyZ2luPXtjYXJkTWFyZ2lufVxuICAgICAgICBpc1ByaXZhdGU9e3ByaXZhdGVVcGxvYWR9XG4gICAgICAgIGxvYWREaXNwbGF5VVJMPXtsb2FkRGlzcGxheVVSTH1cbiAgICAgICAgZGlzcGxheVVSTHM9e2Rpc3BsYXlVUkxzfVxuICAgICAgLz5cbiAgICA8L1N0eWxlZE1vZGFsPlxuICApO1xufVxuXG5leHBvcnQgY29uc3QgZmlsZVNoYXBlID0ge1xuICBkaXNwbGF5VVJMOiBQcm9wVHlwZXMub25lT2ZUeXBlKFtQcm9wVHlwZXMuc3RyaW5nLCBQcm9wVHlwZXMub2JqZWN0XSkuaXNSZXF1aXJlZCxcbiAgaWQ6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAga2V5OiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gIG5hbWU6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgcXVlcnlPcmRlcjogUHJvcFR5cGVzLm51bWJlcixcbiAgc2l6ZTogUHJvcFR5cGVzLm51bWJlcixcbiAgcGF0aDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxufTtcblxuTWVkaWFMaWJyYXJ5TW9kYWwucHJvcFR5cGVzID0ge1xuICBpc1Zpc2libGU6IFByb3BUeXBlcy5ib29sLFxuICBjYW5JbnNlcnQ6IFByb3BUeXBlcy5ib29sLFxuICBmaWxlczogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnNoYXBlKGZpbGVTaGFwZSkpLmlzUmVxdWlyZWQsXG4gIGR5bmFtaWNTZWFyY2g6IFByb3BUeXBlcy5ib29sLFxuICBkeW5hbWljU2VhcmNoQWN0aXZlOiBQcm9wVHlwZXMuYm9vbCxcbiAgZm9ySW1hZ2U6IFByb3BUeXBlcy5ib29sLFxuICBpc0xvYWRpbmc6IFByb3BUeXBlcy5ib29sLFxuICBpc1BlcnNpc3Rpbmc6IFByb3BUeXBlcy5ib29sLFxuICBpc0RlbGV0aW5nOiBQcm9wVHlwZXMuYm9vbCxcbiAgaGFzTmV4dFBhZ2U6IFByb3BUeXBlcy5ib29sLFxuICBpc1BhZ2luYXRpbmc6IFByb3BUeXBlcy5ib29sLFxuICBwcml2YXRlVXBsb2FkOiBQcm9wVHlwZXMuYm9vbCxcbiAgcXVlcnk6IFByb3BUeXBlcy5zdHJpbmcsXG4gIHNlbGVjdGVkRmlsZTogUHJvcFR5cGVzLm9uZU9mVHlwZShbUHJvcFR5cGVzLnNoYXBlKGZpbGVTaGFwZSksIFByb3BUeXBlcy5zaGFwZSh7fSldKSxcbiAgaGFuZGxlRmlsdGVyOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBoYW5kbGVRdWVyeTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgdG9UYWJsZURhdGE6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGhhbmRsZUNsb3NlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBoYW5kbGVTZWFyY2hDaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGhhbmRsZVNlYXJjaEtleURvd246IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGhhbmRsZVBlcnNpc3Q6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGhhbmRsZURlbGV0ZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgaGFuZGxlSW5zZXJ0OiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBzZXRTY3JvbGxDb250YWluZXJSZWY6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGhhbmRsZUFzc2V0Q2xpY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIGhhbmRsZUxvYWRNb3JlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBsb2FkRGlzcGxheVVSTDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgdDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgZGlzcGxheVVSTHM6IFByb3BUeXBlcy5pbnN0YW5jZU9mKE1hcCkuaXNSZXF1aXJlZCxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHRyYW5zbGF0ZSgpKE1lZGlhTGlicmFyeU1vZGFsKTtcbiJdfQ== */"));
function MediaLibraryModal({
  isVisible,
  canInsert,
  files,
  dynamicSearch,
  dynamicSearchActive,
  forImage,
  isLoading,
  isPersisting,
  isDeleting,
  hasNextPage,
  isPaginating,
  privateUpload,
  query,
  selectedFile,
  handleFilter,
  handleQuery,
  toTableData,
  handleClose,
  handleSearchChange,
  handleSearchKeyDown,
  handlePersist,
  handleDelete,
  handleInsert,
  handleDownload,
  setScrollContainerRef,
  handleAssetClick,
  handleLoadMore,
  loadDisplayURL,
  displayURLs,
  t
}) {
  const filteredFiles = forImage ? handleFilter(files) : files;
  const queriedFiles = !dynamicSearch && query ? handleQuery(query, filteredFiles) : filteredFiles;
  const tableData = toTableData(queriedFiles);
  const hasFiles = files && !!files.length;
  const hasFilteredFiles = filteredFiles && !!filteredFiles.length;
  const hasSearchResults = queriedFiles && !!queriedFiles.length;
  const hasMedia = hasSearchResults;
  const shouldShowEmptyMessage = !hasMedia;
  const emptyMessage = isLoading && !hasMedia && t('mediaLibrary.mediaLibraryModal.loading') || dynamicSearchActive && t('mediaLibrary.mediaLibraryModal.noResults') || !hasFiles && t('mediaLibrary.mediaLibraryModal.noAssetsFound') || !hasFilteredFiles && t('mediaLibrary.mediaLibraryModal.noImagesFound') || !hasSearchResults && t('mediaLibrary.mediaLibraryModal.noResults');
  const hasSelection = hasMedia && !(0, _isEmpty2.default)(selectedFile);
  return (0, _core.jsx)(StyledModal, {
    isOpen: isVisible,
    onClose: handleClose,
    isPrivate: privateUpload
  }, (0, _core.jsx)(_MediaLibraryTop.default, {
    t: t,
    onClose: handleClose,
    privateUpload: privateUpload,
    forImage: forImage,
    onDownload: handleDownload,
    onUpload: handlePersist,
    query: query,
    onSearchChange: handleSearchChange,
    onSearchKeyDown: handleSearchKeyDown,
    searchDisabled: !dynamicSearchActive && !hasFilteredFiles,
    onDelete: handleDelete,
    canInsert: canInsert,
    onInsert: handleInsert,
    hasSelection: hasSelection,
    isPersisting: isPersisting,
    isDeleting: isDeleting,
    selectedFile: selectedFile
  }), !shouldShowEmptyMessage ? null : (0, _core.jsx)(_EmptyMessage.default, {
    content: emptyMessage,
    isPrivate: privateUpload
  }), (0, _core.jsx)(_MediaLibraryCardGrid.default, {
    setScrollContainerRef: setScrollContainerRef,
    mediaItems: tableData,
    isSelectedFile: file => selectedFile.key === file.key,
    onAssetClick: handleAssetClick,
    canLoadMore: hasNextPage,
    onLoadMore: handleLoadMore,
    isPaginating: isPaginating,
    paginatingMessage: t('mediaLibrary.mediaLibraryModal.loading'),
    cardDraftText: t('mediaLibrary.mediaLibraryCard.draft'),
    cardWidth: cardWidth,
    cardHeight: cardHeight,
    cardMargin: cardMargin,
    isPrivate: privateUpload,
    loadDisplayURL: loadDisplayURL,
    displayURLs: displayURLs
  }));
}
const fileShape = {
  displayURL: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.object]).isRequired,
  id: _propTypes.default.string.isRequired,
  key: _propTypes.default.string.isRequired,
  name: _propTypes.default.string.isRequired,
  queryOrder: _propTypes.default.number,
  size: _propTypes.default.number,
  path: _propTypes.default.string.isRequired
};
exports.fileShape = fileShape;
MediaLibraryModal.propTypes = {
  isVisible: _propTypes.default.bool,
  canInsert: _propTypes.default.bool,
  files: _propTypes.default.arrayOf(_propTypes.default.shape(fileShape)).isRequired,
  dynamicSearch: _propTypes.default.bool,
  dynamicSearchActive: _propTypes.default.bool,
  forImage: _propTypes.default.bool,
  isLoading: _propTypes.default.bool,
  isPersisting: _propTypes.default.bool,
  isDeleting: _propTypes.default.bool,
  hasNextPage: _propTypes.default.bool,
  isPaginating: _propTypes.default.bool,
  privateUpload: _propTypes.default.bool,
  query: _propTypes.default.string,
  selectedFile: _propTypes.default.oneOfType([_propTypes.default.shape(fileShape), _propTypes.default.shape({})]),
  handleFilter: _propTypes.default.func.isRequired,
  handleQuery: _propTypes.default.func.isRequired,
  toTableData: _propTypes.default.func.isRequired,
  handleClose: _propTypes.default.func.isRequired,
  handleSearchChange: _propTypes.default.func.isRequired,
  handleSearchKeyDown: _propTypes.default.func.isRequired,
  handlePersist: _propTypes.default.func.isRequired,
  handleDelete: _propTypes.default.func.isRequired,
  handleInsert: _propTypes.default.func.isRequired,
  setScrollContainerRef: _propTypes.default.func.isRequired,
  handleAssetClick: _propTypes.default.func.isRequired,
  handleLoadMore: _propTypes.default.func.isRequired,
  loadDisplayURL: _propTypes.default.func.isRequired,
  t: _propTypes.default.func.isRequired,
  displayURLs: _propTypes.default.instanceOf(_immutable.Map).isRequired
};
var _default = (0, _reactPolyglot.translate)()(MediaLibraryModal);
exports.default = _default;