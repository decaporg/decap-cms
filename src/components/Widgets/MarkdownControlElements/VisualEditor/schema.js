import React from 'react';
import Block from './Block';
import styles from './index.css';

/* eslint react/prop-types: 0, react/no-multi-comp: 0 */

// Define the default node type.
export const DEFAULT_NODE = 'paragraph';

/**
 * Define a schema.
 *
 * @type {Object}
 */

export const SCHEMA = {
  nodes: {
    'blockquote': (props) => <Block type='blockquote' {...props.attributes}>{props.children}</Block>,
    'unordered_list': props => <Block type='List'><ul {...props.attributes}>{props.children}</ul></Block>,
    'header_one': props => <Block type='Heading1' {...props.attributes}>{props.children}</Block>,
    'header_two': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
    'header_three': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
    'header_four': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
    'header_five': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
    'header_six': props => <Block type='Heading2' {...props.attributes}>{props.children}</Block>,
    'list_item': props => <li {...props.attributes}>{props.children}</li>,
    'paragraph': props => <Block type='Paragraph' {...props.attributes}>{props.children}</Block>,
    'hr': props => {
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
      const { node, state } = props;
      const isFocused = state.selection.hasEdgeIn(node);
      const className = isFocused ? styles.active : null;
      const src = node.data.get('src');
      return (
        <img {...props.attributes} src={src} className={className} />
      );
    }
  },
  marks: {
    BOLD: {
      fontWeight: 'bold'
    },
    ITALIC: {
      fontStyle: 'italic'
    },
    CODE: {
      fontFamily: 'monospace',
      backgroundColor: '#eee',
      padding: '3px',
      borderRadius: '4px'
    }
  }
}
