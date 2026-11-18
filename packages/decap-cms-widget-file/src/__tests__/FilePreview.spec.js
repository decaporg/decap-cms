import { render } from '@testing-library/react';
import { List } from 'immutable';

import FilePreview from '../FilePreview';

function renderLinks(value, href) {
  const { container } = render(<FilePreview value={value} getAsset={() => href} field={{}} />);
  return [...container.querySelectorAll('a')];
}

describe('FilePreview', () => {
  it('downloads unsaved media instead of opening it in the CMS origin', () => {
    const [link] = renderLinks('uploads/drawing.svg', 'blob:http://localhost/1234');

    expect(link.getAttribute('href')).toBe('blob:http://localhost/1234');
    expect(link.getAttribute('download')).toBe('drawing.svg');
  });

  it('downloads data URLs', () => {
    const [link] = renderLinks('drawing.svg', 'data:image/svg+xml,<svg/>');

    expect(link.getAttribute('download')).toBe('drawing.svg');
  });

  it('opens saved media in a new tab', () => {
    const [link] = renderLinks('uploads/report.pdf', 'https://example.com/uploads/report.pdf');

    expect(link.hasAttribute('download')).toBe(false);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('handles a list of files', () => {
    const links = renderLinks(List(['a.svg', 'b.svg']), 'blob:http://localhost/5678');

    expect(links.map(link => link.getAttribute('download'))).toEqual(['a.svg', 'b.svg']);
  });
});
