import React, { Component } from 'react';
import Link from 'gatsby-link';

/**
 * Manually get table of contents since tableOfContents from markdown
 * nodes have code added.
 *
 * https://github.com/gatsbyjs/gatsby/issues/5436
 */
class TableOfContents extends Component {
  state = {
    headings: [],
  };

  componentDidMount() {
    const contentHeadings = document.querySelectorAll('.docs-content h2');

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
      <ul className="nav-subsections">
        {headings.map(h => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="subnav-link">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    );
  }
}

const DocsNav = ({ items, location }) => (
  <nav className="docs-nav" id="docs-nav">
    {items.map(item => (
      <div className="docs-nav-section" key={item.title}>
        <div className="docs-nav-section-title">{item.title}</div>
        <ul className="docs-nav-section-list">
          {item.group.edges.map(({ node }) => (
            <li className="docs-nav-item" key={node.fields.slug}>
              <Link to={node.fields.slug} className="nav-link" activeClassName="active">
                {node.frontmatter.title}
              </Link>
              {location.pathname === node.fields.slug && <TableOfContents />}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);

export default DocsNav;
