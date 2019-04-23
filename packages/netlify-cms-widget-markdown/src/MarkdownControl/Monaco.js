/** @jsx jsx */

import React from 'react';
import { jsx, css } from '@emotion/core';
import MonacoEditor from 'react-monaco-editor';
import { lengths } from 'netlify-cms-ui-default';

const styles = css`
  border-radius: ${lengths.borderRadius};
  height: 400px;
  position: relative;
  overflow: hidden;
`;


const MonacoRenderer = ({ value, onChange }) => (
  <div
    css={styles}
    onClick={e => {
      e.stopPropagation();
      e.preventDefault();
    }}
    onScroll={e => {
      e.stopPropagation();
    }}
  >
    <MonacoEditor
      language="json"
      theme="vs-dark"
      value={value}
      onChange={onChange}
      options={{
        selectOnLineNumbers: true,
      }}
    />
  </div>
);

export default MonacoRenderer;
