import React, { PropTypes } from 'react';
import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import htmlToRehype from 'rehype-parse';
import rehypeToReact from 'rehype-react';
import cmsPluginToRehype from './cmsPluginRehype';
import previewStyle from '../defaultPreviewStyle';

const MarkdownPreview = ({ value, getAsset }) => {
  const Markdown = unified()
    .use(markdownToRemark, { footnotes: true, pedantic: true })
    .use(remarkToRehype, { allowDangerousHTML: true })
    .use(cmsPluginToRehype, { getAsset })
    .use(rehypeToReact, { createElement: React.createElement })
    .processSync(value)
    .contents;

  return value === null ? null : <div style={previewStyle}>{Markdown}</div>;
};

MarkdownPreview.propTypes = {
  getAsset: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default MarkdownPreview;
