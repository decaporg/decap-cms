import React, { Component } from 'react';
import { Link, StaticQuery, graphql } from 'gatsby';
import classnames from 'classnames';

import TableOfContents from './toc';

import '../css/imports/docs-nav.css';

const toMenu = (menu, nav) =>
  menu.map(group => ({
    title: group.title,
    group: nav.group.find(g => g.fieldValue === group.name),
  }));

class DocsNav extends Component {
  state = {
    isOpen: false,
  };

  toggleNav = () => {
    this.setState(state => ({
      isOpen: !state.isOpen,
    }));
  };

  render() {
    const { location } = this.props;
    const { isOpen } = this.state;

    return (
      <StaticQuery
        query={graphql`
          query docsNavQuery {
            nav: allMarkdownRemark(
              sort: { fields: [frontmatter___weight], order: ASC }
              filter: {
                frontmatter: { title: { ne: null }, group: { ne: null } }
                fields: { slug: { regex: "/docs/" } }
              }
            ) {
              group(field: frontmatter___group) {
                fieldValue
                edges {
                  node {
                    fields {
                      slug
                    }
                    frontmatter {
                      title
                      group
                    }
                    tableOfContents
                  }
                }
              }
            }
            menu: site {
              siteMetadata {
                menu {
                  docs {
                    name
                    title
                  }
                }
              }
            }
          }
        `}
      >
        {data => {
          const docsNav = toMenu(data.menu.siteMetadata.menu.docs, data.nav);

          return (
            <div className="docs-nav">
              <button className="btn-primary docs-nav-btn" onClick={this.toggleNav}>
                {isOpen ? <span>&times;</span> : <span>&#9776;</span>} {isOpen ? 'Hide' : 'Show'}{' '}
                Navigation
              </button>
              <nav
                className={classnames('docs-nav-content', {
                  'is-open': isOpen,
                })}
                id="docs-nav"
              >
                <ul className="docs-nav-list">
                  {docsNav.map(item => (
                    <li className="docs-nav-item" key={item.title}>
                      <div className="docs-nav-title">{item.title}</div>
                      <ul className="docs-nav-list">
                        {item.group.edges.map(({ node }) => (
                          <li className="docs-nav-item" key={node.fields.slug}>
                            <Link
                              to={node.fields.slug}
                              className="docs-nav-link"
                              activeClassName="active"
                              onClick={this.toggleNav}
                            >
                              {node.frontmatter.title}
                            </Link>
                            <div className="docs-nav-toc">
                              {location.pathname === node.fields.slug && (
                                <TableOfContents selector=".docs-content h2" />
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          );
        }}
      </StaticQuery>
    );
  }
}

export default DocsNav;
