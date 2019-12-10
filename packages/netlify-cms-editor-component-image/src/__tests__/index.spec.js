import React from 'react';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';
import component from '../index';

const image = '/image';
const alt = 'alt';
const title = 'title';

describe('editor component image', () => {
  it('should generate empty markdown image from empty object', () => {
    expect(component.toBlock({})).toEqual(`![]()`);
  });

  it('should generate valid markdown from path', () => {
    expect(component.toBlock({ image })).toEqual(`![](/image)`);
  });

  it('should generate valid markdown from path and alt text', () => {
    expect(component.toBlock({ image, alt })).toEqual(`![alt](/image)`);
  });

  it('should generate valid markdown from path and title', () => {
    expect(component.toBlock({ image, title })).toEqual(`![](/image "title")`);
  });

  it('should generate valid markdown from path, alt text, and title ', () => {
    expect(component.toBlock({ image, alt, title })).toEqual(`![alt](/image "title")`);
  });

  it('should escape quotes in title', () => {
    expect(component.toBlock({ image, alt, title: `"ti"tle"` })).toEqual(
      `![alt](/image "\\"ti\\"tle\\"")`,
    );
  });

  it('should match snapshot with props', async () => {
    const props = { image, alt, title };

    const getAsset = path => Promise.resolve(path);

    const Preview = () => component.toPreview(props, getAsset);
    let asFragment;

    await act(async () => {
      asFragment = render(<Preview />).asFragment;
    });
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match markdown with no properties defined', () => {
    expect(`![]()`).toMatch(component.pattern);
  });

  it('should match markdown with path', () => {
    expect(`![](/image)`).toMatch(component.pattern);
  });

  it('should match markdown with path and alt text', () => {
    expect(`![alt](/image)`).toMatch(component.pattern);
  });

  it('should match markdown with path and title', () => {
    expect(`![](/image "title")`).toMatch(component.pattern);
  });

  it('should match markdown with path, alt text, and title', () => {
    expect(`![alt](/image "title")`).toMatch(component.pattern);
  });

  it('should match markdown with path, alt text, and title', () => {
    expect(`![alt](/image "title")`).toMatch(component.pattern);
  });

  it('should match markdown with arbitrary amount of whitespace', () => {
    expect(`![alt](/image    "title")`).toMatch(component.pattern);
  });

  it('should match markdown with quoted title', () => {
    expect(`![alt](/image "\\"ti\\"tle\\"")`).toMatch(component.pattern);
  });
});
