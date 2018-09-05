import React from 'react';
import { BlogPostTemplate } from '../templates/blog-post';
import CMS from 'netlify-cms';
import '../css/lib/prism.css';
import '../css/imports/docs.css';

const BlogPostPreview = ({ entry, widgetFor }) => {
  const data = entry.get('data');
  return (
    <BlogPostTemplate
      title={data.get('title')}
      author={data.get('author')}
      date={data.get('date')}
      body={widgetFor('body')}
    />
  );
};

CMS.registerPreviewTemplate('blog', BlogPostPreview);
