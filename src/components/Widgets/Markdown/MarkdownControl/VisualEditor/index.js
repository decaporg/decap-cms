import React, { Component, PropTypes } from 'react';
import { Map, List } from 'immutable';
import { Editor as SlateEditor, Html as SlateHtml, Raw as SlateRaw} from 'slate';
import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import remarkToMarkdown from 'remark-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import registry from '../../../../../lib/registry';
import { createAssetProxy } from '../../../../../valueObjects/AssetProxy';
import {
  remarkParseConfig,
  remarkStringifyConfig,
  rehypeParseConfig,
  rehypeStringifyConfig,
} from '../../unifiedConfig';
import { buildKeymap } from './keymap';
import createMarkdownParser from './parser';
import Toolbar from '../Toolbar/Toolbar';
import { Sticky } from '../../../../UI/Sticky/Sticky';
import styles from './index.css';

/**
 * Slate can serialize to html, but we persist the value as markdown. Serializing
 * the html to markdown on every keystroke is a big perf hit, so we'll register
 * functions to perform those actions only when necessary, such as after loading
 * and before persisting.
 */
registry.registerWidgetValueSerializer('markdown', {
  serialize: value => unified()
    .use(htmlToRehype, rehypeParseConfig)
    .use(htmlToRehype)
    .use(rehypeToRemark)
    .use(remarkToMarkdown, remarkStringifyConfig)
    .processSync(value)
    .contents,
  deserialize: value => unified()
    .use(markdownToRemark, remarkParseConfig)
    .use(remarkToRehype)
    .use(rehypeToHtml, rehypeStringifyConfig)
    .processSync(value)
    .contents
});

function processUrl(url) {
  if (url.match(/^(https?:\/\/|mailto:|\/)/)) {
    return url;
  }
  if (url.match(/^[^/]+\.[^/]+/)) {
    return `https://${ url }`;
  }
  return `/${ url }`;
}

const DEFAULT_NODE = 'paragraph';

function schemaWithPlugins(schema, plugins) {
  let nodeSpec = schema.nodeSpec;
  plugins.forEach((plugin) => {
    const attrs = {};
    plugin.get('fields').forEach((field) => {
      attrs[field.get('name')] = { default: null };
    });
    nodeSpec = nodeSpec.addToEnd(`plugin_${ plugin.get('id') }`, {
      attrs,
      group: 'block',
      parseDOM: [{
        tag: 'div[data-plugin]',
        getAttrs(dom) {
          return JSON.parse(dom.getAttribute('data-plugin'));
        },
      }],
      toDOM(node) {
        return ['div', { 'data-plugin': JSON.stringify(node.attrs) }, plugin.get('label')];
      },
    });
  });

  return new Schema({
    nodes: nodeSpec,
    marks: schema.markSpec,
  });
}

function createSerializer(schema, plugins) {
  const serializer = Object.create(defaultMarkdownSerializer);
  plugins.forEach((plugin) => {
    serializer.nodes[`plugin_${ plugin.get('id') }`] = (state, node) => {
      const toBlock = plugin.get('toBlock');
      state.write(`${ toBlock.call(plugin, node.attrs) }\n\n`);
    };
  });
  return serializer;
}

const BLOCK_TAGS = {
  p: 'paragraph',
  li: 'list-item',
  ul: 'bulleted-list',
  ol: 'numbered-list',
  blockquote: 'quote',
  pre: 'code',
  h1: 'heading-one',
  h2: 'heading-two',
  h3: 'heading-three',
  h4: 'heading-four',
  h5: 'heading-five',
  h6: 'heading-six',
}

const MARK_TAGS = {
  strong: 'bold',
  em: 'italic',
  u: 'underline',
  s: 'strikethrough',
  del: 'strikethrough',
  code: 'code'
}

const BLOCK_COMPONENTS = {
  'paragraph': props => <p>{props.children}</p>,
  'list-item': props => <li {...props.attributes}>{props.children}</li>,
  'bulleted-list': props => <ul {...props.attributes}>{props.children}</ul>,
  'numbered-list': props => <ol {...props.attributes}>{props.children}</ol>,
  'quote': props => <blockquote {...props.attributes}>{props.children}</blockquote>,
  'code': props => <pre {...props.attributes}><code>{props.children}</code></pre>,
  'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
  'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
  'heading-three': props => <h3 {...props.attributes}>{props.children}</h3>,
  'heading-four': props => <h4 {...props.attributes}>{props.children}</h4>,
  'heading-five': props => <h5 {...props.attributes}>{props.children}</h5>,
  'heading-six': props => <h6 {...props.attributes}>{props.children}</h6>,
  'image': props => {
    const data = props.node && props.node.get('data');
    const src = data && data.get('src', props.src);
    const alt = data && data.get('alt', props.alt);
    return <img src={src} alt={alt} {...props.attributes}/>;
  },
};

const NODE_COMPONENTS = {
  ...BLOCK_COMPONENTS,
  'link': props => {
    const href = props.node && props.node.getIn(['data', 'href']) || props.href;
    return <a href={href} {...props.attributes}>{props.children}</a>;
  },
};

const MARK_COMPONENTS = {
  bold: props => <strong>{props.children}</strong>,
  italic: props => <em>{props.children}</em>,
  underlined: props => <u>{props.children}</u>,
  strikethrough: props => <s>{props.children}</s>,
  code: props => <code>{props.children}</code>,
};

const RULES = [
  {
    deserialize(el, next) {
      const block = BLOCK_TAGS[el.tagName]
      if (!block) return
      return {
        kind: 'block',
        type: block,
        nodes: next(el.children)
      }
    },
    serialize(entity, children) {
      if (['bulleted-list', 'numbered-list'].includes(entity.type)) {
        return;
      }
      const component = BLOCK_COMPONENTS[entity.type]
      if (!component) {
        return;
      }
      return component({ children });
    }
  },
  {
    deserialize(el, next) {
      const mark = MARK_TAGS[el.tagName]
      if (!mark) return
      return {
        kind: 'mark',
        type: mark,
        nodes: next(el.children)
      }
    },
    serialize(entity, children) {
      const component = MARK_COMPONENTS[entity.type]
      if (!component) {
        return;
      }
      return component({ children });
    }
  },
  {
    // Special case for code blocks, which need to grab the nested children.
    deserialize(el, next) {
      if (el.tagName != 'pre') return
      const code = el.children[0]
      const children = code && code.tagName == 'code'
        ? code.children
        : el.children

      return {
        kind: 'block',
        type: 'code',
        nodes: next(children)
      }
    },
  },
  {
    deserialize(el, next) {
      if (el.tagName != 'img') return
      return {
        kind: 'inline',
        type: 'image',
        nodes: [],
        data: {
          src: el.attribs.src,
          alt: el.attribs.alt,
        }
      }
    },
    serialize(entity, children) {
      if (entity.type !== 'image') {
        return;
      }
      const data = entity.get('data');
      const props = {
        src: data.get('src'),
        alt: data.get('alt'),
        attributes: data.get('attributes'),
      };
      return NODE_COMPONENTS.image(props);
    }
  },
  {
    // Special case for links, to grab their href.
    deserialize(el, next) {
      if (el.tagName != 'a') return
      return {
        kind: 'inline',
        type: 'link',
        nodes: next(el.children),
        data: {
          href: el.attribs.href
        }
      }
    },
    serialize(entity, children) {
      if (entity.type !== 'link') {
        return;
      }
      const data = entity.get('data');
      const props = {
        href: data.get('href'),
        attributes: data.get('attributes'),
        children,
      };
      return NODE_COMPONENTS.link(props);
    }
  },
  {
    serialize(entity, children) {
      if (!['bulleted-list', 'unordered-list'].includes(entity.type)) {
        return;
      }
      return NODE_COMPONENTS[entity.type]({ children });
    }
  }

]

const serializer = new SlateHtml({ rules: RULES });

export default class Editor extends Component {
  constructor(props) {
    super(props);
    const plugins = registry.getEditorComponents();
    console.log(this.props.value);
    this.state = {
      editorState: serializer.deserialize(this.props.value || '<p></p>'),
      schema: {
        nodes: NODE_COMPONENTS,
        marks: MARK_COMPONENTS,
      },
      plugins,
    };
  }

  handlePaste = (e, data, state) => {
    if (data.type !== 'html' || data.isShift) {
      return;
    }
    const fragment = serializer.deserialize(data.html).document;
    return state.transform().insertFragment(fragment).apply();
  }

  handleDocumentChange = (doc, editorState) => {
    const html = serializer.serialize(editorState);
    this.props.onChange(html);
  };

  hasMark = type => this.state.editorState.marks.some(mark => mark.type === type);
  hasBlock = type => this.state.editorState.blocks.some(node => node.type === type);

  handleKeyDown = (e, data, state) => {
    if (!data.isMod) {
      return;
    }
    const marks = {
      b: 'bold',
      i: 'italic',
      u: 'underlined',
      s: 'strikethrough',
      '`': 'code',
    };

    const mark = marks[data.key];

    if (mark) {
      state = state.transform().toggleMark(mark).apply();
    }
    return;
  };

  handleMarkClick = (event, type) => {
    event.preventDefault();
    const resolvedState = this.state.editorState.transform().focus().toggleMark(type).apply();
    this.ref.onChange(resolvedState);
    this.setState({ editorState: resolvedState });
  };

  handleBlockClick = (event, type) => {
    event.preventDefault();
    let { editorState } = this.state;
    const transform = editorState.transform().focus();
    const doc = editorState.document;
    const isList = this.hasBlock('list-item')

    // Handle everything except list buttons.
    if (!['bulleted-list', 'numbered-list'].includes(type)) {
      const isActive = this.hasBlock(type);
      const transformed = transform.setBlock(isActive ? DEFAULT_NODE : type);

      if (isList) {
        transformed
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      }
    }

    // Handle the extra wrapping required for list buttons.
    else {
      const isType = editorState.blocks.some(block => {
        return !!doc.getClosest(block.key, parent => parent.type === type);
      });

      if (isList && isType) {
        transform
          .setBlock(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else if (isList) {
        transform
          .unwrapBlock(type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list')
          .wrapBlock(type);
      } else {
        transform
          .setBlock('list-item')
          .wrapBlock(type);
      }
    }

    const resolvedState = transform.apply();
    this.ref.onChange(resolvedState);
    this.setState({ editorState: resolvedState });
  };


  handleLink = () => {
    let url = null;
    if (!markActive(this.view.state, this.state.schema.marks.link)) {
      url = prompt('Link URL:'); // eslint-disable-line no-alert
    }
    const command = toggleMark(this.state.schema.marks.link, { href: url ? processUrl(url) : null });
    command(this.view.state, this.handleAction);
  };

  handlePluginSubmit = (plugin, data) => {
    const { schema } = this.state;
    const nodeType = schema.nodes[`plugin_${ plugin.get('id') }`];
    //this.view.props.onAction(this.view.state.tr.replaceSelectionWith(nodeType.create(data.toJS())).action());
  };

  handleDragEnter = (e) => {
    e.preventDefault();
    this.setState({ dragging: true });
  };

  handleDragLeave = (e) => {
    e.preventDefault();
    this.setState({ dragging: false });
  };

  handleDragOver = (e) => {
    e.preventDefault();
  };

  handleDrop = (e) => {
    e.preventDefault();

    this.setState({ dragging: false });

    const { schema } = this.state;

    const nodes = [];

    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        createAssetProxy(file.name, file)
        .then((assetProxy) => {
          this.props.onAddAsset(assetProxy);
          if (file.type.split('/')[0] === 'image') {
            nodes.push(
              schema.nodes.image.create({ src: assetProxy.public_path, alt: file.name })
            );
          } else {
            nodes.push(
              schema.marks.link.create({ href: assetProxy.public_path, title: file.name })
            );
          }
        });
      });
    } else {
      nodes.push(schema.nodes.paragraph.create({}, e.dataTransfer.getData('text/plain')));
    }

    nodes.forEach((node) => {
      //this.view.props.onAction(this.view.state.tr.replaceSelectionWith(node).action());
    });
  };

  handleToggle = () => {
    this.props.onMode('raw');
  };

  getButtonProps = (type, isBlock) => {
    const handler = isBlock ? this.handleBlockClick: this.handleMarkClick;
    const isActive = isBlock ? this.hasBlock : this.hasMark;
    return { onAction: e => handler(e, type), active: isActive(type) };
  };

  render() {
    const { onAddAsset, onRemoveAsset, getAsset } = this.props;
    const { plugins, selectionPosition, dragging } = this.state;
    const classNames = [styles.editor];
    if (dragging) {
      classNames.push(styles.dragging);
    }

    return (<div
      className={classNames.join(' ')}
      onDragEnter={this.handleDragEnter}
      onDragLeave={this.handleDragLeave}
      onDragOver={this.handleDragOver}
      onDrop={this.handleDrop}
    >
      <Sticky
        className={styles.editorControlBar}
        classNameActive={styles.editorControlBarSticky}
        fillContainerWidth
      >
        <Toolbar
          selectionPosition={selectionPosition}
          buttons={{
            h1: this.getButtonProps('heading-one', true),
            h2: this.getButtonProps('heading-two', true),
            bold: this.getButtonProps('bold'),
            italic: this.getButtonProps('italic'),
            link: this.getButtonProps('link'),
          }}
          onToggleMode={this.handleToggle}
          plugins={plugins}
          onSubmit={this.handlePluginSubmit}
          onAddAsset={onAddAsset}
          onRemoveAsset={onRemoveAsset}
          getAsset={getAsset}
        />
      </Sticky>
      <SlateEditor
        className={styles.slateEditor}
        state={this.state.editorState}
        schema={this.state.schema}
        onChange={editorState => this.setState({ editorState })}
        onDocumentChange={this.handleDocumentChange}
        onKeyDown={this.onKeyDown}
        onPaste={this.handlePaste}
        ref={ref => this.ref = ref}
        spellCheck
      />
      <div className={styles.shim} />
    </div>);
  }
}

Editor.propTypes = {
  onAddAsset: PropTypes.func.isRequired,
  onRemoveAsset: PropTypes.func.isRequired,
  getAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  value: PropTypes.node,
};
