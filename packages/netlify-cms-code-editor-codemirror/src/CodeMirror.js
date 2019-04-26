/** @jsx jsx */
/* eslint-disable react/prop-types */

import React from 'react';
import { jsx, css } from '@emotion/core';
import { find } from 'lodash';
import Resizable from 're-resizable';
import Select from 'react-select';
import CodeMirror from 'codemirror';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';
import codeMirrorStyles from 'codemirror/lib/codemirror.css';
import codeMirrorTheme from 'codemirror/theme/material.css';
import { lengths, reactSelectStyles } from 'netlify-cms-ui-default';
import LanguageSelector from './LanguageSelector';

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

const languages = [
  { name: '', mode: '', label: 'None' },
  { name: 'c', mode: 'text/x-csrc', label: 'C' },
  { name: 'cpp', mode: 'text/x-c++src', label: 'C++' },
  { name: 'java', mode: 'text/x-java', label: 'Java' },
  { name: 'objectivec', mode: 'text/x-objectivec', label: 'Objective-C' },
  { name: 'scala', mode: 'text/x-scala', label: 'Scala' },
  { name: 'kotlin', mode: 'text/x-kotlin', label: 'Kotlin' },
  { name: 'css', mode: 'text/css', label: 'CSS' },
  { name: 'scss', mode: 'text/x-scss', label: 'SCSS' },
  { name: 'less', mode: 'text/x-less', label: 'Less' },
  { name: 'html', mode: 'htmlmixed', label: 'HTML' },
  { name: 'javascript', mode: 'javascript', label: 'JavaScript' },
];

const defaultLanguage = languages[0];

const CodeMirrorRenderer = ({ value, lang, onChange }) => {
  const language = find(languages, { name: lang || '' }) || defaultLanguage;

  return (
    <Resizable defaultSize={{ height: 300 }} minHeight={130}>
      <LanguageSelector
        defaultValue={{ value: language.name, label: language.label }}
        options={languages.map(({ name, label }) => ({ value: name, label }))}
        onChange={opt => {
          onChange(value, (find(languages, { name: opt.value }) || defaultLanguage).name);
        }}
      />
      <ReactCodeMirror
        editorDidMount={() => console.log(CodeMirror.modes) || console.log(CodeMirror.mimeModes)}
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
