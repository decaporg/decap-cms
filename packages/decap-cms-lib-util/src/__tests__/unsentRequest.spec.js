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
