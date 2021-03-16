function Link({ type }) {
  return {
    commands: {
      toggleLink(editor, getUrl) {
        const selection = editor.value.selection;
        const isCollapsed = selection && selection.isCollapsed;

        if (editor.hasInline(type)) {
          const inlines = editor.value.inlines.toJSON();
          const link = inlines.find(item => item.type === type);

          const url = getUrl(link.data.url);

          // remove url if it was removed by the user
          if (url === '') editor.unwrapInline(type);

          // if selection is empty, replace the old link
          if (url && isCollapsed) editor.setInlines({ data: { url } });
        } else {
          const url = getUrl();
          if (!url) return;

          return isCollapsed
            ? editor.insertInline({
                type,
                data: { url },
                nodes: [{ object: 'text', text: url }],
              })
            : editor.wrapInline({ type, data: { url } }).moveToEnd();
        }
      },
    },
  };
}

export default Link;
