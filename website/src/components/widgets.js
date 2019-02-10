import React, { useState, useEffect } from 'react';
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

const Widgets = ({ widgets }) => {
  const [currentWidget, setWidget] = useState(null);

  useEffect(() => {
    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';

    const widgetsContainHash = widgets.edges.some(w => w.node.frontmatter.title === hash);

    if (widgetsContainHash) {
      return setWidget(hash);
    }

    setWidget(widgets.edges[0].node.frontmatter.title);
  }, []);

  const handleWidgetChange = (event, title) => {
    event.preventDefault();

    setWidget(title);

    window.history.pushState(null, null, `#${title}`);
  };

  return (
    <section>
      <WidgetsNav>
        {widgets.edges.map(({ node }) => {
          const { label, title } = node.frontmatter;
          return (
            <Button
              key={title}
              active={currentWidget === title}
              onClick={event => handleWidgetChange(event, title)}
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
};

export default Widgets;
