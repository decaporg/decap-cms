import React from 'react';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import MarkupItReactRenderer from '../MarkupItReactRenderer';
import { storiesOf } from '@kadira/storybook';

const mdContent = `
# Title

* List 1
* List 2
`;

const htmlContent = `
<h1>Title</h1>
<ol>
<li>List item 1</li>
<li>List item 2</li>
</ol>
`;

function getAsset(path) {
  return path;
}

storiesOf('MarkupItReactRenderer', module)
  .add('Markdown', () => (
    <MarkupItReactRenderer
      value={mdContent}
      syntax={markdownSyntax}
      getAsset={getAsset}
    />

  )).add('HTML', () => (
    <MarkupItReactRenderer
      value={htmlContent}
      syntax={htmlSyntax}
      getAsset={getAsset}
    />
  ));
