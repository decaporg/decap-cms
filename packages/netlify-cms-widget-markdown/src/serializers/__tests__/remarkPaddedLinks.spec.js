import unified from 'unified';
import markdownToRemark from 'remark-parse';
import remarkToMarkdown from 'remark-stringify';
import remarkPaddedLinks from '../remarkPaddedLinks';

function input(markdown) {
  return unified()
    .use(markdownToRemark)
    .use(remarkPaddedLinks)
    .use(remarkToMarkdown)
    .processSync(markdown).contents;
}

function output(markdown) {
  return unified()
    .use(markdownToRemark)
    .use(remarkToMarkdown)
    .processSync(markdown).contents;
}

describe('remarkPaddedLinks', () => {
  it('should move leading and trailing spaces outside of a link', () => {
    expect(input('[ a ](b)')).toEqual(output(' [a](b) '));
  });

  it('should convert multiple leading or trailing spaces to a single space', () => {
    expect(input('[  a  ](b)')).toEqual(output(' [a](b) '));
  });

  it('should work with only a leading space or only a trailing space', () => {
    expect(input('[ a](b)[c ](d)')).toEqual(output(' [a](b)[c](d) '));
  });

  it('should work for nested links', () => {
    expect(input('* # a[ b ](c)d')).toEqual(output('* # a [b](c) d'));
  });

  it('should work for parents with multiple links that are not siblings', () => {
    expect(input('# a[ b ](c)d **[ e ](f)**')).toEqual(output('# a [b](c) d ** [e](f) **'));
  });

  it('should work for links with arbitrarily nested children', () => {
    expect(input('[ a __*b*__ _c_ ](d)')).toEqual(output(' [a __*b*__ _c_](d) '));
  });
});
