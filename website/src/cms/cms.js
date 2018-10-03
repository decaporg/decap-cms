import React from 'react';
import CMS from 'netlify-cms';
import dayjs from 'dayjs';
import { BlogPostTemplate } from '../templates/blog-post';
import { DocsTemplate } from '../templates/doc-page';
import WidgetDoc from '../components/widget-doc';
import Release from '../components/release';
import WhatsNew from '../components/whats-new';
import Notification from '../components/notification';
import withHighlight from '../components/with-highlight';
import '../css/imports/docs.css';
import '../css/imports/whatsnew.css';
import '../css/imports/header.css';

const BlogPostPreview = ({ entry, widgetFor }) => {
  const data = entry.get('data');
  return (
    <BlogPostTemplate
      title={data.get('title')}
      author={data.get('author')}
      date={dayjs(data.get('date')).format('MMMM D, YYYY')}
      body={widgetFor('body')}
    />
  );
};

const DocsPreview = ({ entry, widgetFor }) => (
  <DocsTemplate title={entry.getIn(['data', 'title'])} body={widgetFor('body')} />
);

const WidgetDocPreview = ({ entry }) => {
  const { label, description, ui, data_type, options, examples } = entry.get('data').toJS();
  return (
    <WidgetDoc
      visible={true}
      label={label}
      description={description}
      ui={ui}
      dataType={data_type}
      options={options}
      examples={examples}
    />
  );
};

const ReleasePreview = ({ entry }) => (
  <WhatsNew>
    {entry.getIn(['data', 'updates']).map((release, idx) => (
      <Release
        key={idx}
        version={release.get('version')}
        date={dayjs(release.get('date')).format('MMMM D, YYYY')}
        description={release.get('description')}
      />
    ))}
  </WhatsNew>
);

const NotificationPreview = ({ entry }) =>
  entry
    .getIn(['data', 'notifications'])
    .filter(notif => notif.get('published'))
    .map((notif, idx) => (
      <Notification key={idx} url={notif.get('url')} loud={notif.get('loud')}>
        {notif.get('message')}
      </Notification>
    ));

CMS.registerPreviewTemplate('blog', withHighlight(BlogPostPreview));
CMS.registerPreviewTemplate('docs', withHighlight(DocsPreview));
CMS.registerPreviewTemplate('widget_docs', withHighlight(WidgetDocPreview));
CMS.registerPreviewTemplate('releases', ReleasePreview);
CMS.registerPreviewTemplate('notifications', NotificationPreview);
