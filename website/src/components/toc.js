import React, { Component } from 'react';

import '../css/imports/toc.css';

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
    const contentHeadings = document.querySelectorAll(this.props.selector);

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
      <ul className="toc-list">
        {headings.map(h => (
          <li key={h.id} className="toc-item">
            <a href={`#${h.id}`} className="toc-link">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    );
  }
}

export default TableOfContents;
