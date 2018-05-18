import React, { Component } from 'react';

class MobileNav extends Component {
  handleChange = event => {
    this.props.history.push(event.target.value);
  };
  render() {
    const { items } = this.props;

    return (
      <div className="mobile docs-nav">
        <select className="btn-primary" onChange={this.handleChange}>
          <option>Select A Topic</option>
          {items.map(item => (
            <optgroup label={item.title} key={item.title}>
              {item.group.edges.map(({ node }) => (
                <option
                  value={node.fields.slug}
                  key={node.fields.slug}
                  className="nav-link">
                  {node.frontmatter.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    );
  }
}

export default MobileNav;
