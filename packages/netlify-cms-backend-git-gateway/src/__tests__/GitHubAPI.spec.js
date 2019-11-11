import API from '../GitHubAPI';

describe('github API', () => {
  describe('request', () => {
    beforeEach(() => {
      const fetch = jest.fn();
      global.fetch = fetch;
      global.Date = jest.fn(() => ({ getTime: () => 1000 }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should fetch url with authorization header', async () => {
      const api = new API({
        api_root: 'https://site.netlify.com/.netlify/git/github',
        tokenPromise: () => Promise.resolve('token'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'https://site.netlify.com/.netlify/git/github/some-path?ts=1000',
        {
          headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
        },
      );
    });

    it('should throw error on not ok response with message property', async () => {
      const api = new API({
        api_root: 'https://site.netlify.com/.netlify/git/github',
        tokenPromise: () => Promise.resolve('token'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue({ message: 'some error' }),
        ok: false,
        status: 404,
        headers: { get: () => '' },
      });

      await expect(api.request('some-path')).rejects.toThrow(
        expect.objectContaining({
          message: 'some error',
          name: 'API_ERROR',
          status: 404,
          api: 'Git Gateway',
        }),
      );
    });

    it('should throw error on not ok response with msg property', async () => {
      const api = new API({
        api_root: 'https://site.netlify.com/.netlify/git/github',
        tokenPromise: () => Promise.resolve('token'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue({ msg: 'some error' }),
        ok: false,
        status: 404,
        headers: { get: () => '' },
      });

      await expect(api.request('some-path')).rejects.toThrow(
        expect.objectContaining({
          message: 'some error',
          name: 'API_ERROR',
          status: 404,
          api: 'Git Gateway',
        }),
      );
    });
  });
});
