"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DecapCmsEditorComponentImage = void 0;
var _react = _interopRequireDefault(require("react"));
var _core = require("@emotion/core");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const image = {
  label: 'Image',
  id: 'image',
  fromBlock: match => match && {
    image: match[2],
    alt: match[1],
    title: match[4]
  },
  toBlock: ({
    alt,
    image,
    title
  }) => `![${alt || ''}](${image || ''}${title ? ` "${title.replace(/"/g, '\\"')}"` : ''})`,
  // eslint-disable-next-line react/display-name
  toPreview: ({
    alt,
    image,
    title
  }, getAsset, fields) => {
    const imageField = fields === null || fields === void 0 ? void 0 : fields.find(f => f.get('widget') === 'image');
    const src = getAsset(image, imageField);
    return (0, _core.jsx)("img", {
      src: src || '',
      alt: alt || '',
      title: title || ''
    });
  },
  pattern: /^!\[(.*)\]\((.*?)(\s"(.*)")?\)$/,
  fields: [{
    label: 'Image',
    name: 'image',
    widget: 'image',
    media_library: {
      allow_multiple: false
    }
  }, {
    label: 'Alt Text',
    name: 'alt'
  }, {
    label: 'Title',
    name: 'title'
  }]
};
const DecapCmsEditorComponentImage = image;
exports.DecapCmsEditorComponentImage = DecapCmsEditorComponentImage;
var _default = image;
exports.default = _default;