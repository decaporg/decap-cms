import * as api from '../API';

describe('Api', () => {
  describe('getPreviewStatus', () => {
    it('should return preview status on matching context', () => {
      expect(api.getPreviewStatus([{ context: 'deploy' }])).toEqual({ context: 'deploy' });
    });

    it('should return undefined on matching context', () => {
      expect(api.getPreviewStatus([{ context: 'other' }])).toBeUndefined();
    });
  });

  describe('requestWithBackoff', () => {
    function forbidden(body) {
      return {
        status: 403,
        ok: false,
        headers: new Headers(),
        json: () => (body instanceof Error ? Promise.reject(body) : Promise.resolve(body)),
      };
    }

    function createApi(response) {
      return {
        buildRequest: jest.fn(req => req),
        requestFunction: jest.fn().mockResolvedValue(response),
      };
    }

    it.each([
      ['a proxy error body without `message`', { error: 'Forbidden: not a member of this site' }],
      ['a null body', null],
      ['a non-string `message`', { message: { detail: 'Forbidden' } }],
      ['an unparseable body', new SyntaxError('Unexpected token')],
    ])('returns a 403 with %s at once instead of retrying', async (_, body) => {
      const instance = createApi(forbidden(body));

      const response = await api.requestWithBackoff(instance, { url: '/pulls' });

      expect(response.status).toBe(403);
      expect(instance.requestFunction).toHaveBeenCalledTimes(1);
      expect(instance.rateLimiter).toBeUndefined();
    });

    it('keeps the parsed 403 body readable for the caller', async () => {
      const body = { error: 'Forbidden: not a member of this site' };
      const instance = createApi(forbidden(body));

      const response = await api.requestWithBackoff(instance, { url: '/pulls' });

      await expect(response.json()).resolves.toEqual(body);
    });

    it('still treats a GitHub rate-limit 403 as a rate limit', async () => {
      const limited = forbidden({ message: 'API rate limit exceeded for user ID 1.' });
      const ok = { status: 200, ok: true, headers: new Headers() };
      const instance = {
        buildRequest: jest.fn(req => req),
        requestFunction: jest.fn().mockResolvedValueOnce(limited).mockResolvedValueOnce(ok),
        // An existing limiter skips the real pause, so the retry runs at once.
        rateLimiter: { acquire: jest.fn().mockResolvedValue(undefined), release: jest.fn() },
      };

      await expect(api.requestWithBackoff(instance, { url: '/pulls' })).resolves.toBe(ok);
      expect(instance.requestFunction).toHaveBeenCalledTimes(2);
    });
  });
});
