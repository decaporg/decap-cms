import React from 'react';
import marked from 'marked';

const markdownField = {
  widget: 'markdown',
  buttons: ['bold', 'italic', 'code', 'link'],
  editorComponents: [],
  minimal: true,
};

const definitionList = {
  id: 'definition-list',
  label: 'Definition List',
  label_singular: 'Definition',
  widget: 'list',
  fields: [
    { ...markdownField, name: 'term', label: 'Term' },
    { ...markdownField, name: 'definition', label: 'Definition' },
  ],
  fromBlock: match => {
    if (!match) {
      return;
    }
    const itemExp = /(.+)\n: (.+)/g;
    const list =
      match[1] &&
      [...match[1].matchAll(itemExp)].map(({ 1: term, 2: definition }) => ({ term, definition }));
    return list;
  },
  toBlock: (list = []) => {
    return list.map(({ term, definition }) => `${term}\n: ${definition}`).join('\n\n');
  },
  // eslint-disable-next-line react/display-name
  toPreview: (list = []) => (
    <dl>
      {list.map(({ term, definition }) => (
        <>
          <dt dangerouslySetInnerHTML={{ __html: marked(term) }} />
          <dd dangerouslySetInnerHTML={{ __html: marked(definition) }} />
        </>
      ))}
    </dl>
  ),
  pattern: /^((?:.+\n: .+\s{0,3})+)/,
};

export const NetlifyCmsEditorComponentDefinitionList = definitionList;
export default definitionList;
