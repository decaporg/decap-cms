import React from 'react';

import Container from './container';
import SidebarLayout from './sidebar-layout';
import EditLink from './edit-link';
import Widgets from './widgets';
import Markdown from './markdown';
import DocsNav from './docs-nav';

function DocsSidebar({ docsNav, location }) {
  return (
    <aside>
      <DocsNav items={docsNav} location={location} />
    </aside>
  );
}

export default function DocsTemplate({
  title,
  filename,
  body,
  html,
  showWidgets,
  widgets,
  showSidebar,
  docsNav,
  location,
  group,
}) {
  return (
    <Container size="md">
      <SidebarLayout sidebar={showSidebar && <DocsSidebar docsNav={docsNav} location={location} />}>
        <article data-docs-content>
          {filename && <EditLink collection={`docs_${group}`} filename={filename} />}
          <h1>{title}</h1>
          <Markdown body={body} html={html} />
          {showWidgets && <Widgets widgets={widgets} location={location} />}
        </article>
      </SidebarLayout>
    </Container>
  );
}
