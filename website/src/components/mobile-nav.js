import React, { Component } from 'react';

class MobileNav extends Component {
  handleCHange = event => {
    this.props.history.push(event.target.value);
  };
  render() {
    const { items } = this.props;

    return (
      <div className="mobile docs-nav">
        <select className="btn-primary" onChange={this.handleCHange}>
          <option>Select A Topic</option>
          {items.map(({ node }) => (
            <option
              value={node.fields.slug}
              key={node.fields.slug}
              className="nav-link"
            >
              {node.frontmatter.title}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

export default MobileNav;
