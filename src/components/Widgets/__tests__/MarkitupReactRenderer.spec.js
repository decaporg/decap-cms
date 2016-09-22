import React from 'react';
import { shallow } from 'enzyme';
import markdownSyntax from 'markup-it/syntaxes/markdown';
import htmlSyntax from 'markup-it/syntaxes/html';
import MarkitupReactRenderer from '../MarkitupReactRenderer';

describe('MarkitupReactRenderer', () => {
  it('should re-render properly after a value and syntax update', () => {
    const component = shallow(
      <MarkitupReactRenderer
          value="# Title"
          syntax={markdownSyntax}
      />
    );
    const tree1 = component.html();
    component.setProps({
      value: '<h1>Title</h1>',
      syntax: htmlSyntax
    });
    const tree2 = component.html();
    expect(tree1).toEqual(tree2);
  });

  it('should not update the parser if syntax didn\'t change', () => {
    const component = shallow(
      <MarkitupReactRenderer
          value="# Title"
          syntax={markdownSyntax}
      />
    );
    const syntax1 = component.instance().props.syntax;
    component.setProps({
      value: '## Title',
    });
    const syntax2 = component.instance().props.syntax;
    expect(syntax1).toEqual(syntax2);
  });

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
      <MarkitupReactRenderer
          value={value}
          syntax={markdownSyntax}
      />
    );
    const tree = component.html();
    expect(tree).toMatchSnapshot();
  });

  it('should render HTML as is using Markdown', () => {
    const value = `
# Title

<dl>
    <dt>Test HTML content</dt>
    <dd>Testing HTML in Markdown</dd>
</dl>
`;
    const component = shallow(
      <MarkitupReactRenderer
          value={value}
          syntax={markdownSyntax}
      />
    );
    const tree = component.html();
    expect(tree).toMatchSnapshot();
  });

  it('should support custom syntax', () => {
    const value = '';
    const component = shallow(
      <MarkitupReactRenderer
          value={value}
          syntax={markdownSyntax}
      />
    );
    const tree = component.html();
    expect(tree).toMatchSnapshot();
  });

  it('should render HTML', () => {
    const value = '<p class="test class">Paragraph with <em>inline</em> element</p>';
    const component = shallow(
      <MarkitupReactRenderer
          value={value}
          syntax={htmlSyntax}
      />
    );
    const tree = component.html();
    expect(tree).toMatchSnapshot();
  });
});
