import React from 'react';
import renderer from 'react-test-renderer';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import MarkitupReactRenderer from '../MarkitupReactRenderer';

describe('MarkitupReactRenderer', () => {
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
    const component = renderer.create(
      <MarkitupReactRenderer
          value={value}
          syntax={markdownSyntax}
      />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should support custom syntax', () => {
    const value = '';
    const component = renderer.create(
      <MarkitupReactRenderer
          value={value}
          syntax={markdownSyntax}
      />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render HTML', () => {
    const value = '<p class="test class">Paragraph with <em>inline</em> element</p>';
    const component = renderer.create(
      <MarkitupReactRenderer
          value={value}
          syntax={htmlSyntax}
      />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
