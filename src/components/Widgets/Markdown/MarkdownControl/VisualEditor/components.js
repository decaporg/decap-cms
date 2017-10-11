import React from 'react';
import { List } from 'immutable';
import cn from 'classnames';
import { prefixer } from '../../../../../lib/styleHelper';

const styles = prefixer('visualEditor');

/**
 * Slate uses React components to render each type of node that it receives.
 * This is the closest thing Slate has to a schema definition. The types are set
 * by us when we manually deserialize from Remark's MDAST to Slate's AST.
 */

export const MARK_COMPONENTS = {
  bold: props => <strong>{props.children}</strong>,
  italic: props => <em>{props.children}</em>,
  strikethrough: props => <s>{props.children}</s>,
  code: props => <code>{props.children}</code>,
};

export const NODE_COMPONENTS = {
  'paragraph': props => <p {...props.attributes}>{props.children}</p>,
  'list-item': props => <li {...props.attributes}>{props.children}</li>,
  'quote': props => <blockquote {...props.attributes}>{props.children}</blockquote>,
  'code': props => <pre><code {...props.attributes}>{props.children}</code></pre>,
  'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
  'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
  'heading-three': props => <h3 {...props.attributes}>{props.children}</h3>,
  'heading-four': props => <h4 {...props.attributes}>{props.children}</h4>,
  'heading-five': props => <h5 {...props.attributes}>{props.children}</h5>,
  'heading-six': props => <h6 {...props.attributes}>{props.children}</h6>,
  'table': props => <table><tbody {...props.attributes}>{props.children}</tbody></table>,
  'table-row': props => <tr {...props.attributes}>{props.children}</tr>,
  'table-cell': props => <td {...props.attributes}>{props.children}</td>,
  'thematic-break': props => <hr {...props.attributes}/>,
  'bulleted-list': props => <ul {...props.attributes}>{props.children}</ul>,
  'numbered-list': props =>
    <ol {...props.attributes} start={props.node.data.get('start') || 1}>{props.children}</ol>,
  'link': props => {
    const data = props.node.get('data');
    const marks = data.get('marks');
    const url = data.get('url');
    const title = data.get('title');
    const link = <a href={url} title={title} {...props.attributes}>{props.children}</a>;
    const result = !marks ? link : marks.reduce((acc, mark) => {
      const MarkComponent = MARK_COMPONENTS[mark.type];
      return <MarkComponent>{acc}</MarkComponent>;
    }, link);
    return result;
  },
  'image': props => {
    const data = props.node.get('data');
    const marks = data.get('marks');
    const url = data.get('url');
    const title = data.get('title');
    const alt = data.get('alt');
    const image = <img src={url} title={title} alt={alt} {...props.attributes}/>;
    const result = !marks ? image : marks.reduce((acc, mark) => {
      const MarkComponent = MARK_COMPONENTS[mark.type];
      return <MarkComponent>{acc}</MarkComponent>;
    }, image);
    return result;
  },
  'shortcode': props => {
    const { attributes, node, state: editorState } = props;
    const isSelected = editorState.selection.hasFocusIn(node);
    const className = cn('nc-visualEditor-shortcode', { ['nc-visualEditor-shortcodeSelected']: isSelected });
    return <div {...attributes} className={className} draggable >{node.data.get('shortcode')}</div>;
  },
};
