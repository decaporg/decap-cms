import isHotkey from 'is-hotkey';

const Link = () => ({
  commands: {
    toggleLink(editor, getUrl) {
      if (editor.hasInline('link')) {
        editor.unwrapInline('link');
      } else {
        const url = getUrl();
        if (!url) return;

        // If no text is selected, use the entered URL as text.
        if (editor.value.isCollapsed) {
          editor.insertText(url).moveFocusBackward(0 - url.length);
        }

        return editor.wrapInline({ type: 'link', data: { url } }).moveToEnd();
      }
    },
  },
});

export default Link;
