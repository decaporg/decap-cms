/* eslint-disable react/prop-types */

import React from 'react';
import Editor from './CodeMirror'

const CodeEditor = props => (
  <div {...props.attributes}>
    <div onClick={e => e.stopPropagation()}>
      <Editor
        value={props.node.data.get('value')}
        lang={props.node.data.get('lang')}
        onChange={(value, lang) => {
          props.editor.setNodeByKey(props.node.key, { data: { value, lang } });
        }}
      />
    </div>
  </div>
);

export default CodeEditor;
