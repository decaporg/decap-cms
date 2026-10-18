import { meterSave, recordSaveEvent, savedBranch } from '../saveEvent';
import { recordProxyResponse } from '../saveMetrics';
import { recordCmsEvent } from '../telemetry';

import type { ProxyMeter } from '../saveMetrics';

jest.mock('../telemetry', () => ({ recordCmsEvent: jest.fn() }));

const target = {
  baseUrl: 'https://sb.example.com',
  anonKey: 'anon',
  accessToken: 'access-token',
  siteId: 'site-id',
};

const entry = {
  dataFiles: [{ slug: 'post', path: 'content/post.md', raw: 'hello' }],
  assets: [{ fileObj: { size: 2048 } }],
};

function responseWith(serverTiming: string | null) {
  return {
    headers: { get: (name: string) => (name === 'Server-Timing' ? serverTiming : null) },
  } as unknown as Response;
}

/** What a backend's persistEntry does with the three helpers. */
async function persist(
  host: { proxyMeter: ProxyMeter | null },
  save: () => Promise<unknown>,
  options: { collectionName?: string; useWorkflow?: boolean } = { collectionName: 'posts' },
  siteBranch = 'turbo',
) {
  const metered = await meterSave(host, save);
  const branch = savedBranch(metered.result, options, entry, siteBranch);
  recordSaveEvent(target, entry, options, { ...metered, branch });
  return metered.result;
}

function props() {
  return (recordCmsEvent as jest.Mock).mock.calls[0][5];
}

describe('save event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports duration, round trips, upstream time and payload size', async () => {
    const host = { proxyMeter: null };
    await persist(host, async () => {
      // Stands in for the N+4 proxied requests a real save makes.
      recordProxyResponse(host.proxyMeter, responseWith('preamble;dur=20, upstream;dur=120'));
      recordProxyResponse(host.proxyMeter, responseWith('preamble;dur=15, upstream;dur=80'));
      return 'post';
    });

    expect(recordCmsEvent).toHaveBeenCalledTimes(1);
    expect(recordCmsEvent).toHaveBeenCalledWith(
      target.baseUrl,
      target.anonKey,
      target.accessToken,
      'cms_entry_saved',
      target.siteId,
      expect.objectContaining({ collection: 'posts', slug: 'post', path: 'content/post.md' }),
    );
    expect(props().requests).toBe(2);
    expect(props().upstreamMs).toBe(200);
    expect(props().files).toBe(2);
    expect(props().bytes).toBe(2053);
    expect(typeof props().durationMs).toBe('number');
    expect(props().durationMs).toBeGreaterThanOrEqual(0);
  });

  // Zero would read as "the git host answered instantly", which is the one
  // conclusion the data must never support.
  it('omits upstreamMs entirely when no response carried a Server-Timing', async () => {
    const host = { proxyMeter: null };
    await persist(host, async () => {
      recordProxyResponse(host.proxyMeter, responseWith(null));
      return 'post';
    });

    expect(props().requests).toBe(1);
    expect('upstreamMs' in props()).toBe(false);
  });

  // The row already identifies the user; an email here would be a second copy.
  it('sends no email address in the props', async () => {
    await persist({ proxyMeter: null }, async () => 'post');

    expect(props()).not.toHaveProperty('authorEmail');
    expect(JSON.stringify(props())).not.toContain('@');
  });

  // A draft must not be logged as a publish.
  it('reports the site branch for a normal save', async () => {
    await persist({ proxyMeter: null }, async () => 'post');

    expect(props().branch).toBe('turbo');
    expect(props().workflow).toBe(false);
  });

  it('reports the workflow branch for an editorial-workflow save', async () => {
    await persist({ proxyMeter: null }, async () => 'post', {
      collectionName: 'posts',
      useWorkflow: true,
    });

    expect(props().branch).toBe('cms/posts/post');
    expect(props().workflow).toBe(true);
  });

  it('prefers the branch the one-call commit endpoint reports', () => {
    expect(
      savedBranch(
        { sha: 'abc123', branch: 'cms/posts/post' },
        { useWorkflow: true },
        entry,
        'turbo',
      ),
    ).toBe('cms/posts/post');
  });

  it('lets the API client own the content key format', () => {
    const contentKey = jest.fn().mockReturnValue('owner/repo/posts/post');

    expect(
      savedBranch(
        'post',
        { useWorkflow: true, collectionName: 'posts' },
        entry,
        'turbo',
        contentKey,
      ),
    ).toBe('cms/owner/repo/posts/post');
    expect(contentKey).toHaveBeenCalledWith('posts', 'post');
  });

  // A meter left active would silently attribute every subsequent read to the
  // next save.
  it('clears the meter even when the save throws', async () => {
    const host = { proxyMeter: null };

    await expect(
      persist(host, async () => {
        throw new Error('conflict');
      }),
    ).rejects.toThrow('conflict');
    expect(host.proxyMeter).toBeNull();
    expect(recordCmsEvent).not.toHaveBeenCalled();
  });

  it('records nothing for a save that returned nothing or wrote no file', async () => {
    await persist({ proxyMeter: null }, async () => undefined);
    recordSaveEvent(
      target,
      { dataFiles: [] },
      {},
      {
        result: 'post',
        meter: { requests: 0, upstreamMs: 0, upstreamMeasured: false },
        durationMs: 1,
        branch: 'turbo',
      },
    );

    expect(recordCmsEvent).not.toHaveBeenCalled();
  });
});
