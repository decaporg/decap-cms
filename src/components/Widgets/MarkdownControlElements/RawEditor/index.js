import React, { PropTypes } from 'react';
import { Editor, Plain, Mark } from 'slate';
import Prism from 'prismjs';
import PluginDropImages from 'slate-drop-or-paste-images';
import MediaProxy from '../../../../valueObjects/MediaProxy';
import marks from './prismMarkdown';
import styles from './index.css';

Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', marks);
Prism.languages.markdown.bold.inside.url = Prism.util.clone(Prism.languages.markdown.url);
Prism.languages.markdown.italic.inside.url = Prism.util.clone(Prism.languages.markdown.url);
Prism.languages.markdown.bold.inside.italic = Prism.util.clone(Prism.languages.markdown.italic);
Prism.languages.markdown.italic.inside.bold = Prism.util.clone(Prism.languages.markdown.bold);

function renderDecorations(text, block) {
  let characters = text.characters.asMutable();
  const string = text.text;
  const grammar = Prism.languages.markdown;
  const tokens = Prism.tokenize(string, grammar);
  let offset = 0;

  for (const token of tokens) {
    if (typeof token == 'string') {
      offset += token.length;
      continue;
    }

    const length = offset + token.matchedStr.length;
    const name = token.alias || token.type;
    const type = `highlight-${ name }`;

    for (let i = offset; i < length; i++) {
      let char = characters.get(i);
      let { marks } = char;
      marks = marks.add(Mark.create({ type }));
      char = char.merge({ marks });
      characters = characters.set(i, char);
    }

    offset = length;
  }

  return characters.asImmutable();
}

const SCHEMA = {
  rules: [
    {
      match: object => object.kind == 'block',
      decorate: renderDecorations,
    },
  ],
  marks: {
    'highlight-comment': {
      opacity: '0.33',
    },
    'highlight-important': {
      fontWeight: 'bold',
      color: '#006',
    },
    'highlight-keyword': {
      fontWeight: 'bold',
      color: '#006',
    },
    'highlight-url': {
      color: '#006',
    },
    'highlight-punctuation': {
      color: '#006',
    },
  },
};

export default class RawEditor extends React.Component {

  static propTypes = {
    onAddMedia: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const content = props.value ? Plain.deserialize(props.value) : Plain.deserialize('');

    this.state = {
      state: content,
    };

    this.plugins = [
      PluginDropImages({
        applyTransform: (transform, file) => {
          const mediaProxy = new MediaProxy(file.name, file);
          const state = Plain.deserialize(`\n\n![${ file.name }](${ mediaProxy.public_path })\n\n`);
          props.onAddMedia(mediaProxy);
          return transform
            .insertFragment(state.get('document'));
        },
      }),
    ];
  }

  /**
   * Slate keeps track of selections, scroll position etc.
   * So, onChange gets dispatched on every interaction (click, arrows, everything...)
   * It also have an onDocumentChange, that get's dispatched only when the actual
   * content changes
   */
  handleChange = (state) => {
    this.setState({ state });
  };

  handleDocumentChange = (document, state) => {
    const content = Plain.serialize(state, { terse: true });
    this.props.onChange(content);
  };

  render() {
    return (
      <Editor
        className={styles.root}
        placeholder={'Enter some rich text...'}
        state={this.state.state}
        schema={SCHEMA}
        onChange={this.handleChange}
        onDocumentChange={this.handleDocumentChange}
        plugins={this.plugins}
      />
    );
  }
}
