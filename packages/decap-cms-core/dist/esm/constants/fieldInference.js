"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SORTABLE_FIELDS = exports.INFERABLE_FIELDS = exports.IDENTIFIER_FIELDS = void 0;
var _react = _interopRequireDefault(require("react"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const IDENTIFIER_FIELDS = ['title', 'path'];
exports.IDENTIFIER_FIELDS = IDENTIFIER_FIELDS;
const SORTABLE_FIELDS = ['title', 'date', 'author', 'description'];
exports.SORTABLE_FIELDS = SORTABLE_FIELDS;
const INFERABLE_FIELDS = {
  title: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['title', 'name', 'label', 'headline', 'header'],
    defaultPreview: value => (0, _core.jsx)("h1", null, value),
    // eslint-disable-line react/display-name
    fallbackToFirstField: true,
    showError: true
  },
  shortTitle: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['short_title', 'shortTitle', 'short'],
    defaultPreview: value => (0, _core.jsx)("h2", null, value),
    // eslint-disable-line react/display-name
    fallbackToFirstField: false,
    showError: false
  },
  author: {
    type: 'string',
    secondaryTypes: [],
    synonyms: ['author', 'name', 'by', 'byline', 'owner'],
    defaultPreview: value => (0, _core.jsx)("strong", null, value),
    // eslint-disable-line react/display-name
    fallbackToFirstField: false,
    showError: false
  },
  date: {
    type: 'datetime',
    secondaryTypes: ['date'],
    synonyms: ['date', 'publishDate', 'publish_date'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false
  },
  description: {
    type: 'string',
    secondaryTypes: ['text', 'markdown'],
    synonyms: ['shortDescription', 'short_description', 'shortdescription', 'description', 'intro', 'introduction', 'brief', 'content', 'biography', 'bio', 'summary'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false
  },
  image: {
    type: 'image',
    secondaryTypes: [],
    synonyms: ['image', 'thumbnail', 'thumb', 'picture', 'avatar', 'photo', 'cover', 'hero', 'logo'],
    defaultPreview: value => value,
    fallbackToFirstField: false,
    showError: false
  }
};
exports.INFERABLE_FIELDS = INFERABLE_FIELDS;