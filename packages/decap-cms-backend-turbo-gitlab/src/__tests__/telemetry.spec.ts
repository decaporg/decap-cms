import { recordCmsEvent } from '../telemetry';

describe('recordCmsEvent', () => {
  const baseUrl = 'https://example.supabase.co';
  const anonKey = 'anon-key';
  const siteId = 'site-123';

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202 });
  });

  it('does nothing when there is no access token', () => {
    recordCmsEvent(baseUrl, anonKey, null, 'cms_session_started', siteId);
    expect(global.fetch).not.toHaveBeenCalled();

    recordCmsEvent(baseUrl, anonKey, undefined, 'cms_session_started', siteId);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('posts to the telemetry edge function with the expected shape', () => {
    recordCmsEvent(baseUrl, anonKey, 'user-token', 'cms_entry_saved', siteId, {
      collection: 'posts',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];

    expect(url).toBe(`${baseUrl}/functions/v1/telemetry`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: 'Bearer user-token',
      apikey: anonKey,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body)).toEqual({
      event_name: 'cms_entry_saved',
      site_id: siteId,
      props: { collection: 'posts' },
    });
  });

  it('defaults props to an empty object when omitted', () => {
    recordCmsEvent(baseUrl, anonKey, 'user-token', 'cms_session_started', siteId);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body).props).toEqual({});
  });

  it('never throws or rejects when the request fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    expect(() =>
      recordCmsEvent(baseUrl, anonKey, 'user-token', 'cms_session_started', siteId),
    ).not.toThrow();

    // Let the swallowed rejection's microtask flush before the test ends.
    await new Promise(resolve => setTimeout(resolve, 0));
  });
});
