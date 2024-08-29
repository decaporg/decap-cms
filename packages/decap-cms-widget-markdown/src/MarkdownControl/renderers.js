/* eslint-disable react/display-name */
import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { colors, lengths } from 'decap-cms-ui-default';
import { useSelected } from 'slate-react';

import VoidBlock from './components/VoidBlock';
import Shortcode from './components/Shortcode';

const bottomMargin = '16px';

const headerStyles = `
  font-weight: 700;
  line-height: 1;
`;

const StyledH1 = styled.h1`
  ${headerStyles};
  font-size: 32px;
  margin-top: 16px;
`;

const StyledH2 = styled.h2`
  ${headerStyles};
  font-size: 24px;
  margin-top: 12px;
`;

const StyledH3 = styled.h3`
  ${headerStyles};
  font-size: 20px;
`;

const StyledH4 = styled.h4`
  ${headerStyles};
  font-size: 18px;
  margin-top: 8px;
`;

const StyledH5 = styled.h5`
  ${headerStyles};
  font-size: 16px;
  margin-top: 8px;
`;

const StyledH6 = StyledH5.withComponent('h6');

const StyledP = styled.p`
  margin-bottom: ${bottomMargin};
`;

const StyledBlockQuote = styled.blockquote`
  padding-left: 16px;
  border-left: 3px solid ${colors.background};
  margin-left: 0;
  margin-right: 0;
  margin-bottom: ${bottomMargin};
`;

const StyledCode = styled.code`
  background-color: ${colors.background};
  border-radius: ${lengths.borderRadius};
  padding: 0 2px;
  font-size: 85%;
`;

const StyledUl = styled.ul`
  margin-bottom: ${bottomMargin};
  padding-left: 30px;
`;

const StyledOl = StyledUl.withComponent('ol');

const StyledLi = styled.li`
  & > p:first-of-type {
    margin-top: 8px;
  }

  & > p:last-of-type {
    margin-bottom: 8px;
  }
`;

const StyledA = styled.a`
  text-decoration: underline;
  font-size: inherit;
`;

const StyledHr = styled.hr`
  border: 1px solid;
  margin-bottom: 16px;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
`;

const StyledTd = styled.td`
  border: 2px solid black;
  padding: 8px;
  text-align: left;
`;

/**
 * Slate uses React components to render each type of node that it receives.
 * This is the closest thing Slate has to a schema definition. The types are set
 * by us when we manually deserialize from Remark's MDAST to Slate's AST.
 */

/**
 * Mark Components
 */
function Bold(props) {
  return <strong>{props.children}</strong>;
}

function Italic(props) {
  return <em>{props.children}</em>;
}

function Strikethrough(props) {
  return <s>{props.children}</s>;
}

function Code(props) {
  return <StyledCode>{props.children}</StyledCode>;
}

/**
 * Node Components
 */
function Paragraph(props) {
  return <StyledP {...props.attributes}>{props.children}</StyledP>;
}

function ListItem(props) {
  return <StyledLi {...props.attributes}>{props.children}</StyledLi>;
}

function Quote(props) {
  return <StyledBlockQuote {...props.attributes}>{props.children}</StyledBlockQuote>;
}

function HeadingOne(props) {
  return <StyledH1 {...props.attributes}>{props.children}</StyledH1>;
}

function HeadingTwo(props) {
  return <StyledH2 {...props.attributes}>{props.children}</StyledH2>;
}

function HeadingThree(props) {
  return <StyledH3 {...props.attributes}>{props.children}</StyledH3>;
}

function HeadingFour(props) {
  return <StyledH4 {...props.attributes}>{props.children}</StyledH4>;
}

function HeadingFive(props) {
  return <StyledH5 {...props.attributes}>{props.children}</StyledH5>;
}

function HeadingSix(props) {
  return <StyledH6 {...props.attributes}>{props.children}</StyledH6>;
}

function Table(props) {
  return (
    <StyledTable>
      <tbody {...props.attributes}>{props.children}</tbody>
    </StyledTable>
  );
}

function TableRow(props) {
  return <tr {...props.attributes}>{props.children}</tr>;
}

function TableCell(props) {
  return <StyledTd {...props.attributes}>{props.children}</StyledTd>;
}

function ThematicBreak(props) {
  const isSelected = useSelected();
  return (
    <div {...props.attributes}>
      {props.children}
      <div contentEditable={false}>
        <StyledHr
          {...props.attributes}
          css={
            isSelected &&
            css`
              box-shadow: 0 0 0 2px ${colors.active};
              border-radius: 8px;
              color: ${colors.active};
            `
          }
        />
      </div>
    </div>
  );
}

function Break(props) {
  return (
    <>
      <br {...props.attributes} />
      {props.children}
    </>
  );
}

function BulletedList(props) {
  return <StyledUl {...props.attributes}>{props.children}</StyledUl>;
}

function NumberedList(props) {
  return (
    <StyledOl {...props.attributes} start={1}>
      {props.children}
    </StyledOl>
  );
}

function Link(props) {
  const url = props.url;
  const title = props.title || url;

  return (
    <StyledA href={url} title={title} {...props.attributes}>
      {props.children}
    </StyledA>
  );
}

function Image(props) {
  const { url, title, alt } = props.element.data;
  const isSelected = useSelected();
  return (
    <span {...props.attributes}>
      {props.children}
      <img
        src={url}
        title={title}
        alt={alt}
        {...props.attributes}
        css={
          isSelected &&
          css`
            box-shadow: 0 0 0 2px ${colors.active};
          `
        }
      />
    </span>
  );
}

export function Leaf({ attributes, children, leaf }) {
  if (leaf.bold) {
    children = <Bold>{children}</Bold>;
  }

  if (leaf.italic) {
    children = <Italic>{children}</Italic>;
  }

  if (leaf.delete) {
    children = <Strikethrough>{children}</Strikethrough>;
  }

  if (leaf.code) {
    children = <Code>{children}</Code>;
  }

  // if (leaf.break) {
  //   children = <Break />;
  // }

  return <span {...attributes}>{children}</span>;
}

export function renderInline__DEPRECATED() {
  return props => {
    switch (props.node.type) {
      case 'link':
        return <Link {...props} />;
      case 'image':
        return <Image {...props} />;
      case 'break':
        return <Break {...props} />;
    }
  };
}

export function Element(props) {
  const { children, element, classNameWrapper, codeBlockComponent } = props;
  const style = { textAlign: element.align };

  switch (element.type) {
    case 'bulleted-list':
      return <BulletedList>{children}</BulletedList>;
    case 'quote':
      return <Quote>{children}</Quote>;
    case 'heading-one':
      return <HeadingOne>{children}</HeadingOne>;
    case 'heading-two':
      return <HeadingTwo>{children}</HeadingTwo>;
    case 'heading-three':
      return <HeadingThree>{children}</HeadingThree>;
    case 'heading-four':
      return <HeadingFour>{children}</HeadingFour>;
    case 'heading-five':
      return <HeadingFive>{children}</HeadingFive>;
    case 'heading-six':
      return <HeadingSix>{children}</HeadingSix>;
    case 'list-item':
      return <ListItem>{children}</ListItem>;
    case 'numbered-list':
      return <NumberedList>{children}</NumberedList>;
    case 'table':
      return <Table {...props} />;
    case 'table-row':
      return <TableRow {...props} />;
    case 'table-cell':
      return <TableCell {...props} />;
    case 'thematic-break':
      return (
        <VoidBlock {...props}>
          <ThematicBreak {...props} />
        </VoidBlock>
      );
    case 'link':
      return <Link {...props} />;
    case 'image':
      return <Image {...props} />;
    case 'break':
      return <Break {...props} />;
    case 'shortcode':
      if (element.id === 'code-block' && codeBlockComponent) {
        return (
          <VoidBlock {...props}>
            <Shortcode classNameWrapper={classNameWrapper} typeOverload="code-block" {...props} />
          </VoidBlock>
        );
      }
      return (
        <VoidBlock {...props}>
          <Shortcode {...props}>{children}</Shortcode>
        </VoidBlock>
      );
    default:
      return <Paragraph style={style}>{children}</Paragraph>;
  }
}
