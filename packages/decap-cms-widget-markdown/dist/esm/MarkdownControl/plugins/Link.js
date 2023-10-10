"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function Link({
  type
}) {
  return {
    commands: {
      toggleLink(editor, getUrl) {
        const selection = editor.value.selection;
        const isCollapsed = selection && selection.isCollapsed;
        if (editor.hasInline(type)) {
          const inlines = editor.value.inlines.toJSON();
          const link = inlines.find(item => item.type === type);
          const url = getUrl(link.data.url);
          if (url) {
            // replace the old link
            return editor.setInlines({
              data: {
                url
              }
            });
          } else {
            // remove url if it was removed by the user
            return editor.unwrapInline(type);
          }
        } else {
          const url = getUrl();
          if (!url) {
            return;
          }
          return isCollapsed ? editor.insertInline({
            type,
            data: {
              url
            },
            nodes: [{
              object: 'text',
              text: url
            }]
          }) : editor.wrapInline({
            type,
            data: {
              url
            }
          }).moveToEnd();
        }
      }
    }
  };
}
var _default = Link;
exports.default = _default;