import React, { Component } from 'react';
import classnames from 'classnames';

import '../css/imports/widgets.css';

class Widgets extends Component {
  state = {
    currentWidget: 'Boolean'
  };

  render() {
    const { widgets } = this.props;
    const { currentWidget } = this.state;

    return (
      <div>
        <section className="widgets">
          <div className="widgets__cloud">
            {widgets.edges.map(({ node }) => {
              const { label } = node.frontmatter;
              return (
                <span
                  key={label}
                  className={classnames('widgets__item', {
                    widgets__item_active: currentWidget === label
                  })}
                  onClick={event =>
                    this.setState({
                      currentWidget: label
                    })
                  }
                >
                  {label}
                </span>
              );
            })}
          </div>
          <div className="widgets__container">
            {widgets.edges.map(({ node }) => (
              <div
                key={node.frontmatter.label}
                className={classnames('widget', {
                  widget_open: currentWidget === node.frontmatter.label
                })}
              >
                <h3>{node.frontmatter.label}</h3>
                <div dangerouslySetInnerHTML={{ __html: node.html }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }
}

export default Widgets;
