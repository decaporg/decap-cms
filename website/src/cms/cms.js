import React from 'react';
import CMS from 'netlify-cms';
import dayjs from 'dayjs';
import Prism from 'prismjs';
import { BlogPostTemplate } from '../templates/blog-post';
import { DocsTemplate } from '../templates/doc-page';
import WidgetDoc from '../components/widget-doc';
import Release from '../components/release';
import WhatsNew from '../components/whats-new';
import Notification from '../components/notification';
import '../css/imports/docs.css';
import '../css/imports/whatsnew.css';
import '../css/imports/header.css';

const withHighlight = WrappedComponent =>
  class Highlight extends React.Component {
    constructor(props) {
      super(props);
      this.ref = React.createRef();
    }

    highlight() {
      Prism.highlightAllUnder(this.ref.current);
    }

    componentDidMount() {
      this.highlight();
    }

    componentDidUpdate() {
      this.highlight();
    }

    render() {
      return (
        <div className="language-markup" ref={this.ref}>
          <WrappedComponent {...this.props} />
        </div>
      );
    }
  };

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

const WidgetDocPreview = ({ entry, widgetFor }) => (
  <WidgetDoc visible={true} label={entry.get('label')} body={widgetFor('body')} />
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

CMS.registerPreviewTemplate('blog', withHighlight(BlogPostPreview));
CMS.registerPreviewTemplate('docs', withHighlight(DocsPreview));
CMS.registerPreviewTemplate('widget_docs', withHighlight(WidgetDocPreview));
CMS.registerPreviewTemplate('releases', ReleasePreview);
CMS.registerPreviewTemplate('notifications', NotificationPreview);
