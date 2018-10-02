import React, { Component } from 'react';
import classnames from 'classnames';
import WidgetDoc from './widget-doc';
import withHighlight from './with-highlight';

import '../css/imports/widgets.css';

const WidgetDocHighlighted = withHighlight(WidgetDoc);

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
              const { frontmatter } = node;
              const { title, label, description, ui, data_type, options, examples } = frontmatter;
              const isVisible = currentWidget === title;
              return (
                <WidgetDocHighlighted
                  key={title}
                  visible={isVisible}
                  label={label}
                  description={description}
                  ui={ui}
                  dataType={data_type}
                  options={options}
                  examples={examples}
                />
              );
            })}
          </div>
        </section>
      </div>
    );
  }
}

export default Widgets;
