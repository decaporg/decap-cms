/* eslint-disable react/prop-types */

import React from 'react';
import Editor from './CodeMirror';

const noBubble = e => e.stopPropagation();

const CodeEditor = props => (
  <div {...props.attributes}>
    <div onClick={noBubble} onKeyDown={noBubble} onKeyPress={noBubble}>
      <Editor
        value={props.node.data.get('value')}
        onChange={value => props.editor.setNodeByKey(props.node.key, { data: { value } })}
      />
    </div>
  </div>
);

export default CodeEditor;
