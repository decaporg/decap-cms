"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _styledBase = _interopRequireDefault(require("@emotion/styled-base"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireDefault(require("react"));
var _reactImmutableProptypes = _interopRequireDefault(require("react-immutable-proptypes"));
var _reactWaypoint = require("react-waypoint");
var _immutable = require("immutable");
var _collections = require("../../../reducers/collections");
var _EntryCard = _interopRequireDefault(require("./EntryCard"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const CardsGrid = (0, _styledBase.default)("ul", {
  target: "etq0ss00",
  label: "CardsGrid"
})(process.env.NODE_ENV === "production" ? {
  name: "c1vo2d",
  styles: "display:flex;flex-flow:row wrap;list-style-type:none;margin-left:-12px;margin-top:16px;margin-bottom:16px;"
} : {
  name: "c1vo2d",
  styles: "display:flex;flex-flow:row wrap;list-style-type:none;margin-left:-12px;margin-top:16px;margin-bottom:16px;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyeUxpc3RpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVTJCIiwiZmlsZSI6Ii4uLy4uLy4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0NvbGxlY3Rpb24vRW50cmllcy9FbnRyeUxpc3RpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvcFR5cGVzIGZyb20gJ3Byb3AtdHlwZXMnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBJbW11dGFibGVQcm9wVHlwZXMgZnJvbSAncmVhY3QtaW1tdXRhYmxlLXByb3B0eXBlcyc7XG5pbXBvcnQgc3R5bGVkIGZyb20gJ0BlbW90aW9uL3N0eWxlZCc7XG5pbXBvcnQgeyBXYXlwb2ludCB9IGZyb20gJ3JlYWN0LXdheXBvaW50JztcbmltcG9ydCB7IE1hcCB9IGZyb20gJ2ltbXV0YWJsZSc7XG5cbmltcG9ydCB7IHNlbGVjdEZpZWxkcywgc2VsZWN0SW5mZXJlZEZpZWxkIH0gZnJvbSAnLi4vLi4vLi4vcmVkdWNlcnMvY29sbGVjdGlvbnMnO1xuaW1wb3J0IEVudHJ5Q2FyZCBmcm9tICcuL0VudHJ5Q2FyZCc7XG5cbmNvbnN0IENhcmRzR3JpZCA9IHN0eWxlZC51bGBcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1mbG93OiByb3cgd3JhcDtcbiAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xuICBtYXJnaW4tbGVmdDogLTEycHg7XG4gIG1hcmdpbi10b3A6IDE2cHg7XG4gIG1hcmdpbi1ib3R0b206IDE2cHg7XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbnRyeUxpc3RpbmcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0aWMgcHJvcFR5cGVzID0ge1xuICAgIGNvbGxlY3Rpb25zOiBJbW11dGFibGVQcm9wVHlwZXMuaXRlcmFibGUuaXNSZXF1aXJlZCxcbiAgICBlbnRyaWVzOiBJbW11dGFibGVQcm9wVHlwZXMubGlzdCxcbiAgICB2aWV3U3R5bGU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgY3Vyc29yOiBQcm9wVHlwZXMuYW55LmlzUmVxdWlyZWQsXG4gICAgaGFuZGxlQ3Vyc29yQWN0aW9uczogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBwYWdlOiBQcm9wVHlwZXMubnVtYmVyLFxuICB9O1xuXG4gIGhhc01vcmUgPSAoKSA9PiB7XG4gICAgY29uc3QgaGFzTW9yZSA9IHRoaXMucHJvcHMuY3Vyc29yPy5hY3Rpb25zPy5oYXMoJ2FwcGVuZF9uZXh0Jyk7XG4gICAgcmV0dXJuIGhhc01vcmU7XG4gIH07XG5cbiAgaGFuZGxlTG9hZE1vcmUgPSAoKSA9PiB7XG4gICAgaWYgKHRoaXMuaGFzTW9yZSgpKSB7XG4gICAgICB0aGlzLnByb3BzLmhhbmRsZUN1cnNvckFjdGlvbnMoJ2FwcGVuZF9uZXh0Jyk7XG4gICAgfVxuICB9O1xuXG4gIGluZmVyRmllbGRzID0gY29sbGVjdGlvbiA9PiB7XG4gICAgY29uc3QgdGl0bGVGaWVsZCA9IHNlbGVjdEluZmVyZWRGaWVsZChjb2xsZWN0aW9uLCAndGl0bGUnKTtcbiAgICBjb25zdCBkZXNjcmlwdGlvbkZpZWxkID0gc2VsZWN0SW5mZXJlZEZpZWxkKGNvbGxlY3Rpb24sICdkZXNjcmlwdGlvbicpO1xuICAgIGNvbnN0IGltYWdlRmllbGQgPSBzZWxlY3RJbmZlcmVkRmllbGQoY29sbGVjdGlvbiwgJ2ltYWdlJyk7XG4gICAgY29uc3QgZmllbGRzID0gc2VsZWN0RmllbGRzKGNvbGxlY3Rpb24pO1xuICAgIGNvbnN0IGluZmVyZWRGaWVsZHMgPSBbdGl0bGVGaWVsZCwgZGVzY3JpcHRpb25GaWVsZCwgaW1hZ2VGaWVsZF07XG4gICAgY29uc3QgcmVtYWluaW5nRmllbGRzID1cbiAgICAgIGZpZWxkcyAmJiBmaWVsZHMuZmlsdGVyKGYgPT4gaW5mZXJlZEZpZWxkcy5pbmRleE9mKGYuZ2V0KCduYW1lJykpID09PSAtMSk7XG4gICAgcmV0dXJuIHsgdGl0bGVGaWVsZCwgZGVzY3JpcHRpb25GaWVsZCwgaW1hZ2VGaWVsZCwgcmVtYWluaW5nRmllbGRzIH07XG4gIH07XG5cbiAgcmVuZGVyQ2FyZHNGb3JTaW5nbGVDb2xsZWN0aW9uID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbnMsIGVudHJpZXMsIHZpZXdTdHlsZSB9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCBpbmZlcmVkRmllbGRzID0gdGhpcy5pbmZlckZpZWxkcyhjb2xsZWN0aW9ucyk7XG4gICAgY29uc3QgZW50cnlDYXJkUHJvcHMgPSB7IGNvbGxlY3Rpb246IGNvbGxlY3Rpb25zLCBpbmZlcmVkRmllbGRzLCB2aWV3U3R5bGUgfTtcbiAgICByZXR1cm4gZW50cmllcy5tYXAoKGVudHJ5LCBpZHgpID0+IDxFbnRyeUNhcmQgey4uLmVudHJ5Q2FyZFByb3BzfSBlbnRyeT17ZW50cnl9IGtleT17aWR4fSAvPik7XG4gIH07XG5cbiAgcmVuZGVyQ2FyZHNGb3JNdWx0aXBsZUNvbGxlY3Rpb25zID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgY29sbGVjdGlvbnMsIGVudHJpZXMgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgaXNTaW5nbGVDb2xsZWN0aW9uSW5MaXN0ID0gY29sbGVjdGlvbnMuc2l6ZSA9PT0gMTtcbiAgICByZXR1cm4gZW50cmllcy5tYXAoKGVudHJ5LCBpZHgpID0+IHtcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25OYW1lID0gZW50cnkuZ2V0KCdjb2xsZWN0aW9uJyk7XG4gICAgICBjb25zdCBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnMuZmluZChjb2xsID0+IGNvbGwuZ2V0KCduYW1lJykgPT09IGNvbGxlY3Rpb25OYW1lKTtcbiAgICAgIGNvbnN0IGNvbGxlY3Rpb25MYWJlbCA9ICFpc1NpbmdsZUNvbGxlY3Rpb25Jbkxpc3QgJiYgY29sbGVjdGlvbi5nZXQoJ2xhYmVsJyk7XG4gICAgICBjb25zdCBpbmZlcmVkRmllbGRzID0gdGhpcy5pbmZlckZpZWxkcyhjb2xsZWN0aW9uKTtcbiAgICAgIGNvbnN0IGVudHJ5Q2FyZFByb3BzID0geyBjb2xsZWN0aW9uLCBlbnRyeSwgaW5mZXJlZEZpZWxkcywgY29sbGVjdGlvbkxhYmVsIH07XG4gICAgICByZXR1cm4gPEVudHJ5Q2FyZCB7Li4uZW50cnlDYXJkUHJvcHN9IGtleT17aWR4fSAvPjtcbiAgICB9KTtcbiAgfTtcblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb2xsZWN0aW9ucywgcGFnZSB9ID0gdGhpcy5wcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8Q2FyZHNHcmlkPlxuICAgICAgICAgIHtNYXAuaXNNYXAoY29sbGVjdGlvbnMpXG4gICAgICAgICAgICA/IHRoaXMucmVuZGVyQ2FyZHNGb3JTaW5nbGVDb2xsZWN0aW9uKClcbiAgICAgICAgICAgIDogdGhpcy5yZW5kZXJDYXJkc0Zvck11bHRpcGxlQ29sbGVjdGlvbnMoKX1cbiAgICAgICAgICB7dGhpcy5oYXNNb3JlKCkgJiYgPFdheXBvaW50IGtleT17cGFnZX0gb25FbnRlcj17dGhpcy5oYW5kbGVMb2FkTW9yZX0gLz59XG4gICAgICAgIDwvQ2FyZHNHcmlkPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufVxuIl19 */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
});
class EntryListing extends _react.default.Component {
  constructor(...args) {
    super(...args);
    _defineProperty(this, "hasMore", () => {
      var _this$props$cursor, _this$props$cursor$ac;
      const hasMore = (_this$props$cursor = this.props.cursor) === null || _this$props$cursor === void 0 ? void 0 : (_this$props$cursor$ac = _this$props$cursor.actions) === null || _this$props$cursor$ac === void 0 ? void 0 : _this$props$cursor$ac.has('append_next');
      return hasMore;
    });
    _defineProperty(this, "handleLoadMore", () => {
      if (this.hasMore()) {
        this.props.handleCursorActions('append_next');
      }
    });
    _defineProperty(this, "inferFields", collection => {
      const titleField = (0, _collections.selectInferedField)(collection, 'title');
      const descriptionField = (0, _collections.selectInferedField)(collection, 'description');
      const imageField = (0, _collections.selectInferedField)(collection, 'image');
      const fields = (0, _collections.selectFields)(collection);
      const inferedFields = [titleField, descriptionField, imageField];
      const remainingFields = fields && fields.filter(f => inferedFields.indexOf(f.get('name')) === -1);
      return {
        titleField,
        descriptionField,
        imageField,
        remainingFields
      };
    });
    _defineProperty(this, "renderCardsForSingleCollection", () => {
      const {
        collections,
        entries,
        viewStyle
      } = this.props;
      const inferedFields = this.inferFields(collections);
      const entryCardProps = {
        collection: collections,
        inferedFields,
        viewStyle
      };
      return entries.map((entry, idx) => (0, _core.jsx)(_EntryCard.default, _extends({}, entryCardProps, {
        entry: entry,
        key: idx
      })));
    });
    _defineProperty(this, "renderCardsForMultipleCollections", () => {
      const {
        collections,
        entries
      } = this.props;
      const isSingleCollectionInList = collections.size === 1;
      return entries.map((entry, idx) => {
        const collectionName = entry.get('collection');
        const collection = collections.find(coll => coll.get('name') === collectionName);
        const collectionLabel = !isSingleCollectionInList && collection.get('label');
        const inferedFields = this.inferFields(collection);
        const entryCardProps = {
          collection,
          entry,
          inferedFields,
          collectionLabel
        };
        return (0, _core.jsx)(_EntryCard.default, _extends({}, entryCardProps, {
          key: idx
        }));
      });
    });
  }
  render() {
    const {
      collections,
      page
    } = this.props;
    return (0, _core.jsx)("div", null, (0, _core.jsx)(CardsGrid, null, _immutable.Map.isMap(collections) ? this.renderCardsForSingleCollection() : this.renderCardsForMultipleCollections(), this.hasMore() && (0, _core.jsx)(_reactWaypoint.Waypoint, {
      key: page,
      onEnter: this.handleLoadMore
    })));
  }
}
exports.default = EntryListing;
_defineProperty(EntryListing, "propTypes", {
  collections: _reactImmutableProptypes.default.iterable.isRequired,
  entries: _reactImmutableProptypes.default.list,
  viewStyle: _propTypes.default.string,
  cursor: _propTypes.default.any.isRequired,
  handleCursorActions: _propTypes.default.func.isRequired,
  page: _propTypes.default.number
});