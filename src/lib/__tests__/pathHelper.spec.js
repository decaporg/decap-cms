import { forceTrailingSlash } from '../pathHelper';

describe('forceTrailingSlash', () => {
  it('should NOT fix a good path', () => {
    expect(
      forceTrailingSlash('/admin/')
    ).toEqual(
      '/admin/'
    );
  });

  it('should add a trailing slash to a path without one', () => {
    expect(
      forceTrailingSlash('/admin')
    ).toEqual(
      '/admin/'
    );
  });

  it('should remove all trailing but one slashes from a path ending in multiple slashes', () => {
    expect(
      forceTrailingSlash('/admin//')
    ).toEqual(
      '/admin/'
    );

    expect(
      forceTrailingSlash('/admin///')
    ).toEqual(
      '/admin/'
    );
  });
});
