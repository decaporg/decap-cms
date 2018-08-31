import React, { Component } from 'react';
import { Link } from 'gatsby';

class MobileNav extends Component {
  state = {
    isOpen: false,
  };
  toggleNav = () => {
    this.setState({
      isOpen: !this.state.isOpen,
    });
  };
  render() {
    const { items } = this.props;
    const { isOpen } = this.state;

    return (
      <div className="mobile-docs-nav">
        <button className="btn-primary mobile-docs-nav-btn" onClick={this.toggleNav}>
          {isOpen ? <span>&times;</span> : <span>&#9776;</span>} {isOpen ? 'Hide' : 'Show'}{' '}
          Navigation
        </button>
        {isOpen && (
          <nav className="mobile-docs-nav-content">
            <ul className="mobile-docs-nav-list">
              {items.map(item => (
                <li key={item.title} className="mobile-docs-nav-item">
                  {item.title}
                  <ul className="mobile-docs-nav-list">
                    {item.group.edges.map(({ node }) => (
                      <li key={node.fields.slug} className="mobile-docs-nav-item">
                        <Link
                          to={node.fields.slug}
                          className="mobile-docs-nav-link"
                          onClick={this.toggleNav}
                        >
                          {node.frontmatter.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    );
  }
}

export default MobileNav;
