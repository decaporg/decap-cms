import React, { Component } from 'react';
import styled from '@emotion/styled';

import WidgetDoc from './widget-doc';
import Button from './button';

import theme from '../theme';

const WidgetsNav = styled.nav`
  margin-bottom: 1rem;

  > button {
    margin-right: 8px;
    margin-bottom: 8px;
  }
`;

const WidgetsContent = styled.div`
  background: ${theme.colors.lightGray};
  padding: ${theme.space[3]};
  border-radius: 4px;
`;

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
      <section className="widgets">
        <WidgetsNav>
          {widgets.edges.map(({ node }) => {
            const { label, title } = node.frontmatter;
            return (
              <Button
                key={title}
                active={currentWidget === title}
                onClick={event => this.handleWidgetChange(event, title)}
                outline
              >
                {label}
              </Button>
            );
          })}
        </WidgetsNav>
        <WidgetsContent>
          {widgets.edges.map(({ node }) => {
            const { frontmatter, html } = node;
            const { title, label } = frontmatter;
            const isVisible = currentWidget === title;
            return <WidgetDoc key={label} visible={isVisible} label={label} html={html} />;
          })}
        </WidgetsContent>
      </section>
    );
  }
}

export default Widgets;
