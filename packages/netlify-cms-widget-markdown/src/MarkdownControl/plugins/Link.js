const Link = ({ type }) => ({
  commands: {
    toggleLink(editor, getUrl) {
      if (editor.hasInline(type)) {
        editor.unwrapInline(type);
      } else {
        const url = getUrl();
        if (!url) return;

        // If no text is selected, use the entered URL as text.
        if (editor.value.isCollapsed) {
          editor.insertText(url).moveFocusBackward(0 - url.length);
        }

        return editor.wrapInline({ type, data: { url } }).moveToEnd();
      }
    },
  },
});

export default Link;
