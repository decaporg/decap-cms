import React from 'react';
import { List } from 'immutable';
import cn from 'classnames';
import Shortcode from './Shortcode';

/**
 * Slate uses React components to render each type of node that it receives.
 * This is the closest thing Slate has to a schema definition. The types are set
 * by us when we manually deserialize from Remark's MDAST to Slate's AST.
 */

/**
 * Mark Components
 */
const Bold = props => <strong>{props.children}</strong>;
const Italic = props => <em>{props.children}</em>;
const Strikethrough = props => <s>{props.children}</s>;
const Code = props => <code>{props.children}</code>;

/**
 * Node Components
 */
const Paragraph = props => <p {...props.attributes}>{props.children}</p>;
const ListItem = props => <li {...props.attributes}>{props.children}</li>;
const Quote = props => <blockquote {...props.attributes}>{props.children}</blockquote>;
const CodeBlock = props => <pre><code {...props.attributes}>{props.children}</code></pre>;
const HeadingOne = props => <h1 {...props.attributes}>{props.children}</h1>;
const HeadingTwo = props => <h2 {...props.attributes}>{props.children}</h2>;
const HeadingThree = props => <h3 {...props.attributes}>{props.children}</h3>;
const HeadingFour = props => <h4 {...props.attributes}>{props.children}</h4>;
const HeadingFive = props => <h5 {...props.attributes}>{props.children}</h5>;
const HeadingSix = props => <h6 {...props.attributes}>{props.children}</h6>;
const Table = props => <table><tbody {...props.attributes}>{props.children}</tbody></table>;
const TableRow = props => <tr {...props.attributes}>{props.children}</tr>;
const TableCell = props => <td {...props.attributes}>{props.children}</td>;
const ThematicBreak = props => <hr {...props.attributes}/>;
const BulletedList = props => <ul {...props.attributes}>{props.children}</ul>;
const NumberedList = props => (
  <ol {...props.attributes} start={props.node.data.get('start') || 1}>{props.children}</ol>
);
const Link = props => {
  const data = props.node.get('data');
  const marks = data.get('marks');
  const url = data.get('url');
  const title = data.get('title');
  const link = <a href={url} title={title} {...props.attributes}>{props.children}</a>;
  const result = !marks ? link : marks.reduce((acc, mark) => {
    return renderMark({ mark, children: acc });
  }, link);
  return result;
};
const Image = props => {
  const data = props.node.get('data');
  const marks = data.get('marks');
  const url = data.get('url');
  const title = data.get('title');
  const alt = data.get('alt');
  const image = <img src={url} title={title} alt={alt} {...props.attributes}/>;
  const result = !marks ? image : marks.reduce((acc, mark) => {
    return renderMark({ mark, children: acc });
  }, image);
  return result;
};

export const renderMark = props => {
  switch (props.mark.type) {
    case 'bold': return <Bold {...props}/>;
    case 'italic': return <Italic {...props}/>;
    case 'strikethrough': return <Strikethrough {...props}/>;
    case 'code': return <Code {...props}/>;
  }
};

export const renderNode = props => {
  switch (props.node.type) {
    case 'paragraph': return <Paragraph {...props}/>;
    case 'list-item': return <ListItem {...props}/>;
    case 'quote': return <Quote {...props}/>;
    case 'code': return <CodeBlock {...props}/>;
    case 'heading-one': return <HeadingOne {...props}/>;
    case 'heading-two': return <HeadingTwo {...props}/>;
    case 'heading-three': return <HeadingThree {...props}/>;
    case 'heading-four': return <HeadingFour {...props}/>;
    case 'heading-five': return <HeadingFive {...props}/>;
    case 'heading-six': return <HeadingSix {...props}/>;
    case 'table': return <Table {...props}/>;
    case 'table-row': return <TableRow {...props}/>;
    case 'table-cell': return <TableCell {...props}/>;
    case 'thematic-break': return <ThematicBreak {...props}/>;
    case 'bulleted-list': return <BulletedList {...props}/>;
    case 'numbered-list': return <NumberedList {...props}/>;
    case 'link': return <Link {...props}/>;
    case 'image': return <Image {...props}/>;
    case 'shortcode': return <Shortcode {...props}/>;
  }
};
