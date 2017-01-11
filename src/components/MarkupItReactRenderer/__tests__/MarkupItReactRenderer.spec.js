/* eslint max-len:0 */

import React from 'react';
import { shallow } from 'enzyme';
import { padStart } from 'lodash';
import { Map } from 'immutable';
import MarkupIt from 'markup-it';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import reInline from 'markup-it/syntaxes/markdown/re/inline';
import MarkupItReactRenderer from '../';

function getAsset(path) {
  return path;
}

describe('MarkitupReactRenderer', () => {
  describe('basics', () => {
    it('should re-render properly after a value and syntax update', () => {
      const component = shallow(
        <MarkupItReactRenderer
          value="# Title"
          syntax={markdownSyntax}
          getAsset={getAsset}
        />
      );
      const tree1 = component.html();
      component.setProps({
        value: '<h1>Title</h1>',
        syntax: htmlSyntax,
      });
      const tree2 = component.html();
      expect(tree1).toEqual(tree2);
    });

    it('should not update the parser if syntax didn\'t change', () => {
      const component = shallow(
        <MarkupItReactRenderer
          value="# Title"
          syntax={markdownSyntax}
          getAsset={getAsset}
        />
      );
      const syntax1 = component.instance().props.syntax;
      component.setProps({
        value: '## Title',
      });
      const syntax2 = component.instance().props.syntax;
      expect(syntax1).toEqual(syntax2);
    });
  });

  describe('Markdown rendering', () => {
    describe('General', () => {
      it('should render markdown', () => {
        const value = `
# H1

Text with **bold** & _em_ elements

## H2

* ul item 1
* ul item 2

### H3

1. ol item 1
1. ol item 2
1. ol item 3

#### H4

[link title](http://google.com)

##### H5

![alt text](https://pbs.twimg.com/profile_images/678903331176214528/TQTdqGwD.jpg)

###### H6
`;
        const component = shallow(
          <MarkupItReactRenderer
            value={value}
            syntax={markdownSyntax}
            getAsset={getAsset}
          />
        );
        expect(component.html()).toMatchSnapshot();
      });
    });

    describe('Headings', () => {
      for (const heading of [...Array(6).keys()]) {
        it(`should render Heading ${ heading + 1 }`, () => {
          const value = padStart(' Title', heading + 7, '#');
          const component = shallow(
            <MarkupItReactRenderer
              value={value}
              syntax={markdownSyntax}
              getAsset={getAsset}
            />
          );
          expect(component.html()).toMatchSnapshot();
        });
      }
    });

    describe('Lists', () => {
      it('should render lists', () => {
        const value = `
1. ol item 1
1. ol item 2
  * Sublist 1
  * Sublist 2
  * Sublist 3
    1. Sub-Sublist 1
    1. Sub-Sublist 2
    1. Sub-Sublist 3
1. ol item 3
`;
        const component = shallow(
          <MarkupItReactRenderer
            value={value}
            syntax={markdownSyntax}
            getAsset={getAsset}
          />
        );
        expect(component.html()).toMatchSnapshot();
      });
    });

    describe('Links', () => {
      it('should render links', () => {
        const value = `
I get 10 times more traffic from [Google] [1] than from [Yahoo] [2] or [MSN] [3].

  [1]: http://google.com/        "Google"
  [2]: http://search.yahoo.com/  "Yahoo Search"
  [3]: http://search.msn.com/    "MSN Search"
`;
        const component = shallow(
          <MarkupItReactRenderer
            value={value}
            syntax={markdownSyntax}
            getAsset={getAsset}
          />
        );
        expect(component.html()).toMatchSnapshot();
      });
    });

    describe('Code', () => {
      it('should render code', () => {
        const value = 'Use the `printf()` function.';
        const component = shallow(
          <MarkupItReactRenderer
            value={value}
            syntax={markdownSyntax}
            getAsset={getAsset}
          />
        );
        expect(component.html()).toMatchSnapshot();
      });

      it('should render code 2', () => {
        const value = '``There is a literal backtick (`) here.``';
        const component = shallow(
          <MarkupItReactRenderer
            value={value}
            syntax={markdownSyntax}
            getAsset={getAsset}
          />
        );
        expect(component.html()).toMatchSnapshot();
      });
    });

    describe('HTML', () => {
      it('should render HTML as is when using Markdown', () => {
        const value = `
# Title

<form action="test">
  <label for="input">
    <input type="checkbox" checked="checked" id="input"/> My label
  </label>
  <dl class="test-class another-class" style="width: 100%">
      <dt data-attr="test">Test HTML content</dt>
      <dt>Testing HTML in Markdown</dt>
  </dl>
</form>

<h1 style="display: block; border: 10px solid #f00; width: 100%">Test</h1>
`;
        const component = shallow(
          <MarkupItReactRenderer
            value={value}
            syntax={markdownSyntax}
            getAsset={getAsset}
          />
        );
        expect(component.html()).toMatchSnapshot();
      });
    });
  });

  describe('custom elements', () => {
    it('should extend default renderers with custom ones', () => {
      const myRule = MarkupIt.Rule('mediaproxy') // eslint-disable-line
        .regExp(reInline.link, (state, match) => {
          if (match[0].charAt(0) !== '!') {
            return null;
          }

          return {
            data: Map({
              alt: match[1],
              src: match[2],
              title: match[3],
            }).filter(Boolean),
          };
        });

      const myCustomSchema = {
        mediaproxy: ({ token }) => { //eslint-disable-line
          const src = token.getIn(['data', 'src']);
          const alt = token.getIn(['data', 'alt']);
          return <img src={src} alt={alt} />;
        },
      };

      const myMarkdownSyntax = markdownSyntax.addInlineRules(myRule);
      const value = `
## Title

![mediaproxy test](http://url.to.image)
`;
      const component = shallow(
        <MarkupItReactRenderer
          value={value}
          syntax={myMarkdownSyntax}
          schema={myCustomSchema}
          getAsset={getAsset}
        />
      );
      expect(component.html()).toMatchSnapshot();
    });
  });

  describe('HTML rendering', () => {
    it('should render HTML', () => {
      const value = '<p>Paragraph with <em>inline</em> element</p>';
      const component = shallow(
        <MarkupItReactRenderer
          value={value}
          syntax={htmlSyntax}
          getAsset={getAsset}
        />
      );
      expect(component.html()).toMatchSnapshot();
    });
  });
});
