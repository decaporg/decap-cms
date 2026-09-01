import { TextEncoder as NodeTextEncoder } from 'util';

import {
  createProxyMeter,
  measurePayloadBytes,
  parseServerTimingMs,
  recordProxyResponse,
} from '../saveMetrics';

function responseWith(serverTiming?: string) {
  return {
    headers: { get: (name: string) => (name === 'Server-Timing' ? serverTiming ?? null : null) },
  } as unknown as Response;
}

describe('parseServerTimingMs', () => {
  it('reads a named metric out of a multi-metric header', () => {
    expect(parseServerTimingMs('preamble;dur=12, upstream;dur=302, total;dur=316', 'upstream')).toBe(
      302,
    );
  });

  it('tolerates whitespace and float durations', () => {
    expect(parseServerTimingMs('upstream ; dur = 4.5', 'upstream')).toBe(4.5);
  });

  it('returns null for an absent metric rather than zero', () => {
    expect(parseServerTimingMs('total;dur=10', 'upstream')).toBeNull();
    expect(parseServerTimingMs(null, 'upstream')).toBeNull();
  });

  it('does not match a metric whose name merely contains the query', () => {
    expect(parseServerTimingMs('upstream_retry;dur=10', 'upstream')).toBeNull();
  });
});

describe('recordProxyResponse', () => {
  it('counts every response and sums the upstream time', () => {
    const meter = createProxyMeter();

    recordProxyResponse(meter, responseWith('preamble;dur=10, upstream;dur=100'));
    recordProxyResponse(meter, responseWith('preamble;dur=8, upstream;dur=50'));

    expect(meter).toEqual({ requests: 2, upstreamMs: 150, upstreamMeasured: true });
  });

  // An older edge function, or a browser that stripped the header, must leave
  // upstream reported as unknown — not as a suspiciously fast zero.
  it('counts a response with no Server-Timing but leaves upstream unmeasured', () => {
    const meter = createProxyMeter();

    recordProxyResponse(meter, responseWith());

    expect(meter).toEqual({ requests: 1, upstreamMs: 0, upstreamMeasured: false });
  });

  it('is a no-op when no save is in flight', () => {
    expect(() => recordProxyResponse(null, responseWith('upstream;dur=5'))).not.toThrow();
  });
});

describe('measurePayloadBytes', () => {
  const globalWithEncoder = globalThis as { TextEncoder?: unknown };
  const originalTextEncoder = globalWithEncoder.TextEncoder;

  afterEach(() => {
    globalWithEncoder.TextEncoder = originalTextEncoder;
  });

  it('counts encoded bytes, not UTF-16 code units', () => {
    // Every browser has TextEncoder; this test environment does not, so it is
    // supplied here rather than asserted away. 'č' is two bytes in UTF-8 but
    // one code unit — the case a string length would understate, and non-ASCII
    // content is the norm for most of our editors.
    globalWithEncoder.TextEncoder = NodeTextEncoder;

    expect(measurePayloadBytes([{ raw: 'č' }], [])).toBe(2);
  });

  // The fallback exists so measurement degrades to an approximation rather
  // than throwing where TextEncoder is absent.
  it('falls back to string length when TextEncoder is unavailable', () => {
    globalWithEncoder.TextEncoder = undefined;

    expect(measurePayloadBytes([{ raw: 'č' }], [])).toBe(1);
  });

  it('adds asset sizes to data file bytes', () => {
    globalWithEncoder.TextEncoder = NodeTextEncoder;

    expect(measurePayloadBytes([{ raw: 'abc' }], [{ fileObj: { size: 1024 } }])).toBe(1027);
  });

  it('skips files and assets carrying no measurable payload', () => {
    expect(measurePayloadBytes([{}], [{}])).toBe(0);
    expect(measurePayloadBytes()).toBe(0);
  });
});
