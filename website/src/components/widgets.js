import React, { Component } from 'react';
import classnames from 'classnames';
import WidgetDoc from './widget-doc';

import '../css/imports/widgets.css';

class Widgets extends Component {
  state = {
    currentWidget: null,
  };

  componentDidMount() {
    const { widgets } = this.props;

    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';

    const widgetsContainHash = widgets.edges.some(w => w.node.frontmatter.title === hash);

    if (widgetsContainHash) {
      return this.setState({
        currentWidget: hash,
      });
    }

    this.setState({
      currentWidget: widgets.edges[0].node.frontmatter.title,
    });
  }

  handleWidgetChange = (event, title) => {
    event.preventDefault();
    this.setState(
      {
        currentWidget: title,
      },
      () => {
        window.history.pushState(null, null, `#${title}`);
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
              const { label, title } = node.frontmatter;
              return (
                <button
                  key={title}
                  className={classnames('widgets__item', {
                    widgets__item_active: currentWidget === title,
                  })}
                  onClick={event => this.handleWidgetChange(event, title)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="widgets__container">
            {widgets.edges.map(({ node }) => {
              const { frontmatter, html } = node;
              const { title, label } = frontmatter;
              const isVisible = currentWidget === title;
              return <WidgetDoc key={label} visible={isVisible} label={label} html={html} />;
            })}
          </div>
        </section>
      </div>
    );
  }
}

export default Widgets;
