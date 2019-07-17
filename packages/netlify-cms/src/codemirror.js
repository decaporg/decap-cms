// Modes
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/dockerfile/dockerfile';
import 'codemirror/mode/diff/diff';
import 'codemirror/mode/elm/elm';
import 'codemirror/mode/go/go';
import 'codemirror/mode/gfm/gfm';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jinja2/jinja2';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/perl/perl';
import 'codemirror/mode/php/php';
import 'codemirror/mode/powershell/powershell';
import 'codemirror/mode/pug/pug';
import 'codemirror/mode/puppet/puppet';
import 'codemirror/mode/python/phython';
import 'codemirror/mode/r/r';
import 'codemirror/mode/rst/rst';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/swift/swift';
import 'codemirror/mode/toml/toml';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/mode/xml/xml';

// Keymaps
import 'codemirror/keymap/vim';
import 'codemirror/keymap/sublime';
import 'codemirror/keymap/emacs';

// Themes
import styles from 'codemirror/lib/codemirror.css';
import material from 'codemirror/theme/material.css';

// Internal stuff, should go last
import { NetlifyCmsApp as CMS } from 'netlify-cms-app/dist/esm';
import NetlifyCmsWidgetCode from 'netlify-cms-widget-code';

// `name` properties loosely correspond to
// [Prism.js](https://prismjs.com/#supported-languages) language keys.
const defaultLanguages = [
  { name: 'bash', mode: 'shell', label: 'Bash' },
  { name: 'c', mode: 'text/x-csrc', label: 'C' },
  { name: 'cpp', mode: 'text/x-c++src', label: 'C++' },
  { name: 'csharp', mode: 'text/x-c++src', label: 'C#', aliases: ['cs', 'dotnet'] },
  { name: 'css', mode: 'css', label: 'CSS' },
  { name: 'diff', mode: 'diff', label: 'Diff' },
  { name: 'dockerfile', mode: 'dockerfile', label: 'Docker', aliases: ['docker'] },
  { name: 'elm', mode: 'elm', label: 'Elm' },
  { name: 'go', mode: 'go', label: 'Go' },
  { name: 'handlebars', mode: { name: 'handlebars', base: 'text/html' }, label: 'Handlebars' },
  { name: 'html', mode: 'htmlmixed', label: 'HTML' },
  { name: 'java', mode: 'text/x-java', label: 'Java' },
  { name: 'javascript', mode: 'javascript', label: 'JavaScript', aliases: ['js'] },
  { name: 'jinja2', mode: 'jinja2', label: 'Jinja2' },
  { name: 'json', mode: 'application/json', label: 'JSON', aliases: ['jsonp', 'json5'] },
  { name: 'jsx', mode: 'jsx', label: 'JSX' },
  { name: 'markdown', mode: 'gfm', label: 'Markdown', aliases: ['md', 'gfm'] },
  { name: 'markup', mode: 'xml', label: 'Markup' },
  { name: 'kotlin', mode: 'text/x-kotlin', label: 'Kotlin' },
  { name: 'objectivec', mode: 'text/x-objectivec', label: 'Objective-C' },
  { name: 'perl', mode: 'perl', label: 'Perl' },
  { name: 'php', mode: 'php', label: 'PHP' },
  { name: 'powershell', mode: 'powershell', label: 'PowerShell' },
  { name: 'pug', mode: 'pug', label: 'Pug', aliases: ['jade'] },
  { name: 'puppet', mode: 'puppet', label: 'Puppet' },
  { name: 'python', mode: 'python', label: 'Python', aliases: ['py'] },
  { name: 'r', mode: 'r', label: 'R' },
  { name: 'rst', mode: 'rst', label: 'reStructuredText', aliases: ['rest'] },
  { name: 'ruby', mode: 'ruby', label: 'Ruby', aliases: ['rb'] },
  { name: 'rust', mode: 'rust', label: 'Rust' },
  { name: 'scala', mode: 'text/x-scala', label: 'Scala' },
  { name: 'scss', mode: 'text/x-scss', label: 'SCSS' },
  { name: 'shell', mode: 'shell', label: 'Shell', aliases: ['sh'] },
  { name: 'sql', mode: 'sql', label: 'SQL' },
  { name: 'swift', mode: 'swift', label: 'Swift' },
  { name: 'toml', mode: 'toml', label: 'TOML' },
  { name: 'svg', mode: 'xml', label: 'SVG' },
  { name: 'typescript', mode: 'text/typescript', label: 'TypeScript', aliases: ['ts'] },
  { name: 'tsx', mode: 'text/typescript-jsx', label: 'TSX' },
];

const defaultConfig = {
  theme: 'material',
};

CMS.registerWidget([
  NetlifyCmsWidgetCode.Widget({
    globalStyles: [styles, material],
    //languages: defaultLanguages,
    themes: ['material'],
    codeMirrorConfig: defaultConfig,
  }),
]);

CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
