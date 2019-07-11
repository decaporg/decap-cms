import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';
import styles from 'codemirror/lib/codemirror.css';
import material from 'codemirror/theme/material.css';
import monokai from 'codemirror/theme/monokai.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/sublime';
import 'codemirror/keymap/emacs';

// Code widget and default Codemirror extensions, and probably
// css too, emotion should work here
import NetlifyCmsWidgetCode from 'netlify-cms-widget-code';

const defaultLanguages = [
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

const defaultConfig = {
  theme: 'material',
};

CMS.registerWidget([
  NetlifyCmsWidgetCode.Widget({
    globalStyles: [styles, material, monokai],
    languages: defaultLanguages,
    themes: ['material', 'monokai'],
    //codeMirrorConfig: defaultConfig,
  }),
]);

CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
