import React from 'react';
import { List } from 'immutable';
import cn from 'classnames';

/**
 * Slate uses React components to render each type of node that it receives.
 * This is the closest thing Slate has to a schema definition. The types are set
 * by us when we manually deserialize from Remark's MDAST to Slate's AST.
 */

export const renderMark = props => {
  switch (props.mark.type) {
    case bold: return props => <strong>{props.children}</strong>;
    case italic: return props => <em>{props.children}</em>;
    case strikethrough: return props => <s>{props.children}</s>;
    case code: return props => <code>{props.children}</code>;
  }
};

export const renderNode = props => {
  switch (props.node.type) {
    case 'paragraph': return props => <p {...props.attributes}>{props.children}</p>;
    case 'list-item': return props => <li {...props.attributes}>{props.children}</li>;
    case 'quote': return props => <blockquote {...props.attributes}>{props.children}</blockquote>;
    case 'code': return props => <pre><code {...props.attributes}>{props.children}</code></pre>;
    case 'heading-one': return props => <h1 {...props.attributes}>{props.children}</h1>;
    case 'heading-two': return props => <h2 {...props.attributes}>{props.children}</h2>;
    case 'heading-three': return props => <h3 {...props.attributes}>{props.children}</h3>;
    case 'heading-four': return props => <h4 {...props.attributes}>{props.children}</h4>;
    case 'heading-five': return props => <h5 {...props.attributes}>{props.children}</h5>;
    case 'heading-six': return props => <h6 {...props.attributes}>{props.children}</h6>;
    case 'table': return props => <table><tbody {...props.attributes}>{props.children}</tbody></table>;
    case 'table-row': return props => <tr {...props.attributes}>{props.children}</tr>;
    case 'table-cell': return props => <td {...props.attributes}>{props.children}</td>;
    case 'thematic-break': return props => <hr {...props.attributes}/>;
    case 'bulleted-list': return props => <ul {...props.attributes}>{props.children}</ul>;
    case 'numbered-list': return props => (
      <ol {...props.attributes} start={props.node.data.get('start') || 1}>{props.children}</ol>
    );
    case 'link': return props => {
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
    };
    case 'image': props => {
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
    };
    case 'shortcode': props => {
      const { attributes, node, editor } = props;
      const isSelected = editor.value.selection.hasFocusIn(node);
      const className = cn('nc-visualEditor-shortcode', { ['nc-visualEditor-shortcodeSelected']: isSelected });
      return <div {...attributes} className={className} draggable >{node.data.get('shortcode')}</div>;
    };
  }
};
