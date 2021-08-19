import React from 'react';
import CMS from 'netlify-cms-app';
import dayjs from 'dayjs';
import Prism from 'prismjs';
import { CacheProvider } from '@emotion/core';
import createCache from '@emotion/cache';

import BlogPostTemplate from '../components/blog-post-template';
import { LayoutTemplate as Layout } from '../components/layout';
import DocsTemplate from '../components/docs-template';
import WidgetDoc from '../components/widget-doc';
import WhatsNew from '../components/whats-new';
import Notification from '../components/notification';
import Community from '../components/community';
import siteConfig from '../../site.yml';

let emotionCache;
function getEmotionCache() {
  const previewPaneIframe = document.querySelector('iframe[class*="PreviewPaneFrame"]');
  const previewPaneHeadEl = previewPaneIframe.contentWindow.document.querySelector('head');
  if (!emotionCache || emotionCache.sheet.container !== previewPaneHeadEl) {
    emotionCache = createCache({ container: previewPaneHeadEl });
  }
  return emotionCache;
}

function PreviewContainer({ children, highlight }) {
  return (
    <CacheProvider value={getEmotionCache()}>
      <Layout>{highlight ? <Highlight>{children}</Highlight> : children}</Layout>
    </CacheProvider>
  );
}

class Highlight extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  highlight() {
    setTimeout(() => {
      if (this.ref.current) {
        Prism.highlightAllUnder(this.ref.current);
      }
    });
  }

  componentDidMount() {
    this.highlight();
  }

  componentDidUpdate() {
    this.highlight();
  }

  render() {
    return <div ref={this.ref}>{this.props.children}</div>;
  }
}

function BlogPostPreview({ entry, widgetFor }) {
  const data = entry.get('data');
  return (
    <PreviewContainer highlight={true}>
      <BlogPostTemplate
        title={data.get('title')}
        author={data.get('author')}
        date={dayjs(data.get('date')).format('MMMM D, YYYY')}
        body={widgetFor('body')}
      />
    </PreviewContainer>
  );
}

function CommunityPreview({ entry }) {
  const { title, headline, subhead, sections } = entry.get('data').toJS();
  return (
    <PreviewContainer>
      <Community title={title} headline={headline} subhead={subhead} sections={sections} />
    </PreviewContainer>
  );
}

function DocsPreview({ entry, widgetFor }) {
  return (
    <PreviewContainer highlight={true}>
      <DocsTemplate title={entry.getIn(['data', 'title'])} body={widgetFor('body')} />
    </PreviewContainer>
  );
}

function WidgetDocPreview({ entry, widgetFor }) {
  return (
    <PreviewContainer highlight={true}>
      <WidgetDoc visible={true} label={entry.get('label')} body={widgetFor('body')} />
    </PreviewContainer>
  );
}

function ReleasePreview({ entry }) {
  return (
    <PreviewContainer highlight={true}>
      <WhatsNew
        updates={entry
          .getIn(['data', 'updates'])
          .map(release => ({
            version: release.get('version'),
            date: dayjs(release.get('date')).format('MMMM D, YYYY'),
            description: release.get('description'),
          }))
          .toJS()}
      />
    </PreviewContainer>
  );
}

function NotificationPreview({ entry }) {
  return (
    <PreviewContainer>
      {entry
        .getIn(['data', 'notifications'])
        .filter(notif => notif.get('published'))
        .map((notif, idx) => (
          <Notification key={idx} url={notif.get('url')} loud={notif.get('loud')}>
            {notif.get('message')}
          </Notification>
        ))}
    </PreviewContainer>
  );
}

CMS.registerPreviewTemplate('blog', BlogPostPreview);
siteConfig.menu.docs.forEach(group => {
  CMS.registerPreviewTemplate(`docs_${group.name}`, DocsPreview);
});
CMS.registerPreviewTemplate('widget_docs', WidgetDocPreview);
CMS.registerPreviewTemplate('releases', ReleasePreview);
CMS.registerPreviewTemplate('notifications', NotificationPreview);
CMS.registerPreviewTemplate('community', CommunityPreview);
