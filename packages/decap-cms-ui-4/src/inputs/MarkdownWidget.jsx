import React from 'react';
import styled from '@emotion/styled';
import { Editor } from 'slate-react';
import { Value } from 'slate';

import { isKeyHotkey } from 'is-hotkey';
import Field from '../Field';
import ButtonGroup from '../ButtonGroup';
import IconButton from '../IconButton';
import Fullscreen from '../Fullscreen';
import Tooltip from '../Tooltip';

const Toolbar = styled.div`
  position: relative;
  padding: 1px 18px 17px;
  margin: 0 -1rem;
  display: flex;
`;
const ToolbarButtonsStart = styled(ButtonGroup)`
  margin: 0 -0.5rem;
  flex: 1;
`;
const ToolbarButtonsEnd = styled(ButtonGroup)`
  margin: 0 -0.5rem;
`;
const EditorWrap = styled.div`
  color: ${({ theme }) => theme.color.mediumEmphasis};
  font-family: 'Charter', serif;
  font-size: 18px;
  & blockquote {
    display: block;
    border-left: 2px solid ${({ theme }) => theme.color.disabled};
    background-color: ${({ theme }) => theme.color.surfaceHighlight};
    margin: 1em;
    padding: 0.5em 0.75em;
  }
  & code {
    display: block;
    background-color: ${({ theme }) => theme.color.surfaceHighlight};
    margin: 1em 0;
    padding: 0.5em;
    border-radius: 0.25em;
  }
`;

const initialValue = {
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            text: '',
          },
        ],
      },
    ],
  },
};

const DEFAULT_NODE = 'paragraph';

const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

class MarkdownWidget extends React.Component {
  state = {
    value: Value.fromJSON(initialValue),
    fullscreen: false,
  };

  hasMark = type => {
    const { value } = this.state;
    return value.activeMarks.some(mark => mark.type === type);
  };

  hasBlock = type => {
    const { value } = this.state;
    return value.blocks.some(node => node.type === type);
  };

  ref = editor => {
    this.editor = editor;
  };

  render() {
    const { name, label } = this.props;
    const { isFullscreen } = this.state;

    return (
      <Fullscreen isFullscreen={isFullscreen}>
        <Field label={label} labelTarget={name} focus={this.state.hasFocus} noBorder={isFullscreen}>
          <Toolbar>
            <ToolbarButtonsStart>
              {this.renderMarkButton('Bold', 'bold', 'bold')}
              {this.renderMarkButton('Italic', 'italic', 'italic')}
              {this.renderMarkButton('Underlined', 'underlined', 'underline')}
              {this.renderMarkButton('Code', 'code', 'code')}
              {this.renderBlockButton('Heading One', 'heading-one', 'heading-one')}
              {this.renderBlockButton('Heading Two', 'heading-two', 'heading-two')}
              {this.renderBlockButton('Heading Three', 'heading-three', 'heading-three')}
              {this.renderBlockButton('Block Quote', 'block-quote', 'quote')}
              {this.renderBlockButton('Numbered List', 'numbered-list', 'numbered-list')}
              {this.renderBlockButton('Bulleted List', 'bulleted-list', 'bulleted-list')}
            </ToolbarButtonsStart>
            <ToolbarButtonsEnd>
              <Tooltip label="Fullscreen" enterDelay={1000}>
                <div>
                  <IconButton
                    onMouseDown={e => {
                      e.preventDefault();
                      this.setState({ isFullscreen: !isFullscreen });
                    }}
                    icon={isFullscreen ? 'minimize' : 'maximize'}
                  />
                </div>
              </Tooltip>
            </ToolbarButtonsEnd>
          </Toolbar>
          <EditorWrap
            onFocus={() => {
              setTimeout(() => this.setState({ hasFocus: true }), 0);
            }}
            onBlur={() => {
              setTimeout(() => this.setState({ hasFocus: false }), 0);
            }}
          >
            <Editor
              spellCheck
              placeholder={`Type ${label ? label.toLowerCase() : 'something'} here`}
              ref={this.ref}
              value={this.state.value}
              onChange={this.onChange}
              onKeyDown={this.onKeyDown}
              renderBlock={this.renderBlock}
              renderMark={this.renderMark}
              style={{ minHeight: '8rem' }}
            />
          </EditorWrap>
        </Field>
      </Fullscreen>
    );
  }

  renderMarkButton = (label, type, icon) => {
    const isActive = this.hasMark(type);

    return (
      <Tooltip label={label} enterDelay={1000}>
        <div>
          <IconButton
            active={isActive}
            onMouseDown={event => this.onClickMark(event, type)}
            icon={icon}
          />
        </div>
      </Tooltip>
    );
  };

  renderBlockButton = (label, type, icon) => {
    let isActive = this.hasBlock(type);

    if (['numbered-list', 'bulleted-list'].includes(type)) {
      const {
        value: { document, blocks },
      } = this.state;

      if (blocks.size > 0) {
        const parent = document.getParent(blocks.first().key);
        isActive = this.hasBlock('list-item') && parent && parent.type === type;
      }
    }

    return (
      <Tooltip label={label} enterDelay={1000}>
        <div>
          <IconButton
            active={isActive}
            onMouseDown={event => this.onClickBlock(event, type)}
            icon={icon}
          />
        </div>
      </Tooltip>
    );
  };

  renderBlock = (props, editor, next) => {
    const { attributes, children, node } = props;

    switch (node.type) {
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>;
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>;
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>;
      default:
        return next();
    }
  };

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>;
      case 'code':
        return <code {...attributes}>{children}</code>;
      case 'italic':
        return <em {...attributes}>{children}</em>;
      case 'underlined':
        return <u {...attributes}>{children}</u>;
      default:
        return next();
    }
  };

  onChange = ({ value }) => {
    this.setState({ value }, () => this.props.onChange && this.props.onChange(value));
  };

  onKeyDown = (event, editor, next) => {
    let mark;

    if (isBoldHotkey(event)) {
      mark = 'bold';
    } else if (isItalicHotkey(event)) {
      mark = 'italic';
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underlined';
    } else if (isCodeHotkey(event)) {
      mark = 'code';
    } else {
      return next();
    }

    event.preventDefault();
    editor.toggleMark(mark);
  };

  onClickMark = (event, type) => {
    event.preventDefault();
    this.editor.toggleMark(type);
  };

  onClickBlock = (event, type) => {
    event.preventDefault();

    const { editor } = this;
    const { value } = editor;
    const { document } = value;

    // Handle everything but list buttons.
    if (type !== 'bulleted-list' && type !== 'numbered-list') {
      const isActive = this.hasBlock(type);
      const isList = this.hasBlock('list-item');

      if (isList) {
        editor
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else {
        editor.setBlocks(isActive ? DEFAULT_NODE : type);
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock('list-item');
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type === type);
      });

      if (isList && isType) {
        editor
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else if (isList) {
        editor
          .unwrapBlock(type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list')
          .wrapBlock(type);
      } else {
        editor.setBlocks('list-item').wrapBlock(type);
      }
    }
  };
}

export default MarkdownWidget;
