import React, { Component } from 'react';
import classnames from 'classnames';

import '../css/imports/widgets.css';

class Widgets extends Component {
  state = {
    currentWidget: null,
  };

  componentDidMount() {
    const { widgets } = this.props;

    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';

    const widgetsContainHash = widgets.edges.some(w => w.node.frontmatter.target === hash);

    if (widgetsContainHash) {
      return this.setState({
        currentWidget: hash,
      });
    }

    this.setState({
      currentWidget: widgets.edges[0].node.frontmatter.target,
    });
  }

  handleWidgetChange = (event, target) => {
    event.preventDefault();
    this.setState(
      {
        currentWidget: target,
      },
      () => {
        window.history.pushState(null, null, `#${target}`);
      },
    );
  };

  render() {
    const { widgets } = this.props;
    const { currentWidget } = this.state;

    return (
      <div>
        <section className="widgets">
          <div className="widgets__cloud">
            {widgets.edges.map(({ node }) => {
              const { label, target } = node.frontmatter;
              return (
                <button
                  key={target}
                  className={classnames('widgets__item', {
                    widgets__item_active: currentWidget === target,
                  })}
                  onClick={event => this.handleWidgetChange(event, target)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="widgets__container">
            {widgets.edges.map(({ node }) => {
              const { label, target } = node.frontmatter;
              return (
                <div
                  key={label}
                  className={classnames('widget', {
                    widget_open: currentWidget === target,
                  })}
                >
                  <h3>{label}</h3>
                  <div dangerouslySetInnerHTML={{ __html: node.html }} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }
}

export default Widgets;
