/** @jsx jsx */
/* eslint-disable react/prop-types */

import React, { useState } from 'react';
import { jsx, css } from '@emotion/core';
import Resizable from 're-resizable';
import Select from 'react-select';
import { Controlled as CodeMirror } from 'react-codemirror2';
import codeMirrorStyles from 'codemirror/lib/codemirror.css';
import codeMirrorTheme from 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import { lengths, reactSelectStyles } from 'netlify-cms-ui-default';

const styles = css`
  ${codeMirrorStyles};
  ${codeMirrorTheme};

  // Enforce border radius on CodeMirror's absolute positioned gutter
  border-radius: ${lengths.borderRadius};
  overflow: hidden;
  z-index: 0;
  position: relative;
  height: 100%;

  & > .CodeMirror {
    height: 100%;
  }
`;

const selectStyles = {
  ...reactSelectStyles,
  container: provided => ({
    ...reactSelectStyles.container(provided),
    width: '120px',
    position: 'absolute',
    zIndex: 2,
    right: '8px',
    top: '8px',
    transition: 'opacity 1s',
    transitionTimingFunction: 'cubic-bezier(.75,.02,.7,1)',
    opacity: '0.2',
    ':hover,:focus-within': {
      opacity: '1',
      transition: 'opacity .2s ease',
    },
  }),
  control: provided => ({
    ...reactSelectStyles.control(provided),
    padding: 0,
    fontSize: '13px',
    minHeight: 'auto',
  }),
  dropdownIndicator: provided => ({
    ...reactSelectStyles.dropdownIndicator(provided),
    padding: '4px',
  }),
  option: (provided, state) => ({
    ...reactSelectStyles.option(provided, state),
    padding: 0,
    paddingLeft: '8px',
  }),
  menu: (provided, state) => ({
    ...reactSelectStyles.menu(provided),
    margin: '2px 0',
  }),
};

const modes = {
  html: { name: 'htmlmixed', label: 'HTML' },
  javascript: { name: 'javascript', label: 'JavaScript' },
};

const CodeMirrorRenderer = ({ value, onChange }) => {
  const [mode, setMode] = useState();

  return (
    <Resizable defaultSize={{ height: 300 }} minHeight={130}>
      <Select
        styles={selectStyles}
        options={Object.values(modes).map(({ name, label }) => ({ value: name, label }))}
        onChange={({ value }) => setMode(value)}
      />
      <CodeMirror
        css={styles}
        options={{
          theme: 'material',
          lineNumbers: true,
          autofocus: true,
          mode,
        }}
        value={value}
        onBeforeChange={(editor, data, newValue) => {
          onChange(newValue, /*pass lang back*/);
        }}
      />
    </Resizable>
  );
};

export default CodeMirrorRenderer;
