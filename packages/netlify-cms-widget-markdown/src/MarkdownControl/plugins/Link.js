const Link = ({ type }) => ({
  commands: {
    toggleLink(editor, getUrl) {
      if (editor.hasInline(type)) {
        editor.unwrapInline(type);
      } else {
        const url = getUrl();
        if (!url) return;

        const selection = editor.value.selection;
        const isCollapsed = selection && selection.isCollapsed;
        if (isCollapsed) {
          // If no text is selected, use the entered URL as text.
          return editor.insertInline({
            type,
            data: { url },
            nodes: [{ object: 'text', text: url }],
          });
        } else {
          return editor.wrapInline({ type, data: { url } }).moveToEnd();
        }
      }
    },
  },
});

export default Link;
