import React from 'react';
import CMS from 'netlify-cms';
import dayjs from 'dayjs';
import { BlogPostTemplate } from '../templates/blog-post';
import { DocsTemplate } from '../templates/doc-page';
import { RoadmapTemplate } from '../pages/roadmap';
import { CommunityTemplate } from '../pages/community';
import Release from '../components/release';
import WhatsNew from '../components/whats-new';
import Notification from '../components/notification';
import '../css/lib/prism.css';
import '../css/imports/docs.css';
import '../css/imports/hero.css';
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

const RoadmapPreview = ({ entry, widgetFor }) => {
  const { title, description, heading, intro } = entry.get('data').toJS();
  return (
    <RoadmapTemplate
      title={title}
      description={description}
      heading={heading}
      intro={intro}
      body={widgetFor('body')}
    />
  );
};

const CommunityPreview = ({ entry }) => {
  const { title, headline, subhead, primarycta, upcomingevent, howitworks, howtojoin } = entry
    .get('data')
    .toJS();
  return (
    <CommunityTemplate
      title={title}
      headline={headline}
      subhead={subhead}
      cta={primarycta}
      eventIntro={upcomingevent.hook}
      howItWorks={howitworks}
      howToJoin={howtojoin}
    />
  );
};

CMS.registerPreviewTemplate('blog', BlogPostPreview);
CMS.registerPreviewTemplate('docs', DocsPreview);
CMS.registerPreviewTemplate('releases', ReleasePreview);
CMS.registerPreviewTemplate('notifications', NotificationPreview);
CMS.registerPreviewTemplate('roadmap', RoadmapPreview);
CMS.registerPreviewTemplate('community', CommunityPreview);
