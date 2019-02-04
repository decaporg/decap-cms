import React, { Component } from 'react';
import styled from '@emotion/styled';

import theme from '../theme';
import { NavLink } from './docs-nav';

const TocList = styled.ol`
  margin: ${theme.space[2]} 0;
  padding-left: ${theme.space[3]};
  border-left: 2px solid ${theme.colors.lightestGray};
  list-style-type: none;
`;

const TocLink = styled.a`
  display: block;
  font-size: ${theme.fontsize[2]};
  color: ${theme.colors.gray};
  transition: color 0.2s;
  line-height: ${theme.lineHeight[1]};
  margin: ${theme.space[2]} 0;

  &:hover {
    color: ${theme.colors.darkGreen};
  }
`;

/**
 * Maually get table of contents since tableOfContents from markdown
 * nodes have code added.
 *
 * https://github.com/gatsbyjs/gatsby/issues/5436
 */
class TableOfContents extends Component {
  state = {
    headings: [],
  };
  componentDidMount() {
    const contentHeadings = document.querySelectorAll('[data-docs-content] h2');
    const headings = [];
    contentHeadings.forEach(h => {
      headings.push({
        id: h.id,
        text: h.innerText,
      });
    });
    this.setState({
      headings,
    });
  }
  render() {
    const { headings } = this.state;
    return (
      <TocList>
        {headings.map(h => (
          <li key={h.id}>
            <TocLink href={`#${h.id}`}>{h.text}</TocLink>
          </li>
        ))}
      </TocList>
    );
  }
}

export default TableOfContents;
