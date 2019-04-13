/** @jsx jsx */
/* eslint-disable react/prop-types */

import React from 'react';
import { jsx, css } from '@emotion/core';
import { Controlled as CodeMirror } from 'react-codemirror2';
import codeMirrorStyles from 'codemirror/lib/codemirror.css';
import codeMirrorTheme from 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/keymap/vim';

const styles = css`
  ${codeMirrorStyles};
  ${codeMirrorTheme};
`;

const CodeMirrorRenderer = ({ value, onChange }) => (
  <div css={styles}>
    <CodeMirror
      options={{
        mode: 'javascript',
        theme: 'material',
        lineNumbers: true,
        keyMap: 'vim',
      }}
      value={value}
      onBeforeChange={(editor, data, value) => onChange(value)}
    />
  </div>
);

export default CodeMirrorRenderer;
