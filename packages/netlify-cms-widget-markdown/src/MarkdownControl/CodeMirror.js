/** @jsx jsx */
/* eslint-disable react/prop-types */

import React from 'react';
import { jsx, css } from '@emotion/core';
import { find } from 'lodash';
import Resizable from 're-resizable';
import Select from 'react-select';
import { Controlled as CodeMirror } from 'react-codemirror2';
import codeMirrorStyles from 'codemirror/lib/codemirror.css';
import codeMirrorTheme from 'codemirror/theme/material.css';
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

const languages = [
  { name: '', mode: '', label: 'None' },
  { name: 'html', mode: 'htmlmixed', label: 'HTML' },
  { name: 'css', mode: 'css', label: 'CSS' },
  { name: 'javascript', mode: 'javascript', label: 'JavaScript' },
];

const CodeMirrorRenderer = ({ value, lang, onChange }) => {
  const language = find(languages, { name: lang || '' });

  return (
    <Resizable defaultSize={{ height: 300 }} minHeight={130}>
      <Select
        styles={selectStyles}
        defaultValue={{ value: language.name, label: language.label }}
        options={languages.map(({ name, label }) => ({ value: name, label }))}
        onChange={opt => {
          onChange(value, find(languages, { name: opt.value }).name);
        }}
      />
      <CodeMirror
        css={styles}
        options={{
          theme: 'material',
          lineNumbers: true,
          autofocus: true,
          mode: language.mode,
        }}
        value={value}
        onBeforeChange={(editor, data, newValue) => {
          onChange(newValue, language.name);
        }}
      />
    </Resizable>
  );
};

export default CodeMirrorRenderer;
