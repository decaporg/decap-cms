import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkToRehype from 'remark-rehype';
import rehypeToHtml from 'rehype-stringify';
import htmlToRehype from 'rehype-parse';
import rehypeToRemark from 'rehype-remark';
import remarkToMarkdown from 'remark-stringify';
import rehypeSanitize from 'rehype-sanitize';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';

const remarkParseConfig = { fences: true };
const remarkStringifyConfig = { listItemIndent: '1', fences: true };
const rehypeParseConfig = { fragment: true };

export const markdownToHtml = markdown =>
  unified()
    .use(markdownToRemark, remarkParseConfig)
    .use(remarkToRehype)
    .use(rehypeSanitize)
    .use(rehypeMinifyWhitespace)
    .use(rehypeToHtml)
    .processSync(markdown)
    .contents;

export const htmlToMarkdown = html =>
  unified()
    .use(htmlToRehype, rehypeParseConfig)
    .use(rehypeSanitize)
    .use(rehypeMinifyWhitespace)
    .use(rehypeToRemark)
    .use(remarkToMarkdown, remarkStringifyConfig)
    .processSync(html)
    .contents;
