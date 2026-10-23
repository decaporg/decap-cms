import unsentRequest from '../unsentRequest';

describe('unsentRequest', () => {
  describe('withHeaders', () => {
    it('should create new request with headers', () => {
      expect(unsentRequest.withHeaders({ Authorization: 'token' })('path').toJS()).toEqual({
        url: 'path',
        headers: { Authorization: 'token' },
      });
    });

    it('should add headers to existing request', () => {
      expect(unsentRequest.withHeaders({ Authorization: 'token' }, 'path').toJS()).toEqual({
        url: 'path',
        headers: { Authorization: 'token' },
      });
    });
  });

  describe('fromURL', () => {
    it('should read + in the query string as a space', () => {
      const req = unsentRequest.fromURL(
        'https://api.bitbucket.org/2.0/pullrequests?pagelen=50&q=state+%3D+%22OPEN%22&page=2',
      );

      expect(req.getIn(['params', 'q'])).toBe('state = "OPEN"');
      expect(unsentRequest.toURL(req)).toBe(
        'https://api.bitbucket.org/2.0/pullrequests?pagelen=50&q=state%20%3D%20%22OPEN%22&page=2',
      );
    });

    it('should keep an encoded plus as a plus', () => {
      const req = unsentRequest.fromURL('https://example.com/search?q=1%2B1');

      expect(req.getIn(['params', 'q'])).toBe('1+1');
      expect(unsentRequest.toURL(req)).toBe('https://example.com/search?q=1%2B1');
    });
  });

  describe('non-plain bodies', () => {
    // A FormData is iterable, so a deep conversion would turn it into a
    // collection and `fetch` would end up with a plain object instead.
    it('should keep a FormData body passed as part of the request', () => {
      const body = new FormData();
      body.append('branch', 'master');

      // This is the shape the Bitbucket backend uses: the body is part of the
      // request object rather than applied by `withBody`.
      const req = unsentRequest.withHeaders(
        { Authorization: 'token' },
        {
          url: 'path',
          method: 'POST',
          body,
        },
      );

      expect(req.get('body') === body).toBe(true);
      expect(req.toJS().body === body).toBe(true);
    });

    it('should keep a FormData body intact via fromFetchArguments', () => {
      const body = new FormData();
      body.append('branch', 'master');

      const req = unsentRequest.fromFetchArguments('path', { method: 'POST', body });

      expect(req.get('body') === body).toBe(true);
    });

    it('should still convert params and headers to maps', () => {
      const req = unsentRequest.fromFetchArguments('path', {
        method: 'POST',
        headers: { Authorization: 'token' },
      });

      expect(req.toJS()).toEqual({
        url: 'path',
        method: 'POST',
        headers: { Authorization: 'token' },
      });
    });
  });
});
