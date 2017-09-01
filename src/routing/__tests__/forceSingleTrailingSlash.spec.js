import { forceSingleTrailingSlash } from '../forceSingleTrailingSlash';

describe('forceSingleTrailingSlash', () => {
  it('should NOT fix a good path', () => {
    let fixedPathname = null;
    forceSingleTrailingSlash(
      { location: { pathname: '/admin/' } },
      (newLocation) => { fixedPathname = newLocation.pathname; }
    );
    expect(
      fixedPathname
    ).toEqual(
      null
    );
  });

  it('should add a trailing slash to a path without one', () => {
    let fixedPathname = null;
    forceSingleTrailingSlash(
      { location: { pathname: '/admin' } },
      (newLocation) => { fixedPathname = newLocation.pathname; }
    );
    expect(
      fixedPathname
    ).toEqual(
      '/admin/'
    );
  });

  it('should remove all trailing but one slashes from a path ending in 2 slashes', () => {
    let fixedPathname = null;
    forceSingleTrailingSlash(
      { location: { pathname: '/admin//' } },
      (newLocation) => { fixedPathname = newLocation.pathname; }
    );
    expect(
      fixedPathname
    ).toEqual(
      '/admin/'
    );
  });

  it('should remove all trailing but one slashes from a path ending in 3 slashes', () => {
    let fixedPathname = null;
    forceSingleTrailingSlash(
      { location: { pathname: '/admin///' } },
      (newLocation) => { fixedPathname = newLocation.pathname; }
    );
    expect(
      fixedPathname
    ).toEqual(
      '/admin/'
    );
  });
});
