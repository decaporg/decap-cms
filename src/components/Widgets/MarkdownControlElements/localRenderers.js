import React from 'react';
import Block from './Block';
import styles from './localRenderers.css'

/* eslint react/prop-types: 0, react/no-multi-comp: 0 */

// Define the default node type.
export const DEFAULT_NODE = 'paragraph';

// Local node renderers.
export const NODES = {
  'block-quote': (props) => <Block type='blockquote' {...props.attributes}>{props.children}</Block>,
  'bulleted-list': props => <Block type='List'><ul {...props.attributes}>{props.children}</ul></Block>,
  'heading1': props => <Block type='Heading1' {...props.attributes}>{props.children}</Block>,
  'heading2': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading3': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading4': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading5': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'heading6': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
  'list-item': props => <li {...props.attributes}>{props.children}</li>,
  'paragraph': props => <Block type='Paragraph' {...props.attributes}>{props.children}</Block>,
  'horizontal-rule': props => {
    const { node, state } = props;
    const isFocused = state.selection.hasEdgeIn(node);
    const className = isFocused ? styles.active : null;
    return (
      <hr className={className} {...props.attributes} />
    );
  },
  'link': (props) => {
    const { data } = props.node;
    const href = data.get('href');
    return <a {...props.attributes} href={href}>{props.children}</a>;
  },
  'image': (props) => {
    const { node } = props;
    const src = node.data.get('src');
    return (
      <img {...props.attributes} src={src} />
    );
  }
};

// Local mark renderers.
export const MARKS = {
  bold: {
    fontWeight: 'bold'
  },
  italic: {
    fontStyle: 'italic'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: '3px',
    borderRadius: '4px'
  }
};
