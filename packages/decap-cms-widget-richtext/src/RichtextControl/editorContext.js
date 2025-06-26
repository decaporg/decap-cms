import React, { createContext, useContext } from 'react';

const EditorContext = createContext(null);

export function useEditorContext() {
  return useContext(EditorContext);
}

export function EditorProvider({ children, editorControl, editorComponents }) {
  const value = { editorControl, editorComponents };
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}
