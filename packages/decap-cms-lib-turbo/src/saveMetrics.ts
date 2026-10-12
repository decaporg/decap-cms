/**
 * Measurement for the save path, reported on `cms_entry_saved`: how much of
 * the wait on a save is the git host, and how much is round trips.
 */

/** Matches one `dur=NN` parameter, tolerating whitespace and a float value. */
const DURATION_PARAM = /^dur\s*=\s*(\d+(?:\.\d+)?|\.\d+)$/;

/**
 * Reads one metric out of a `Server-Timing` header; null rather than 0 when
 * absent, so a missing header is never mistaken for an instant request.
 */
export function parseServerTimingMs(header: string | null, metric: string): number | null {
  if (!header) {
    return null;
  }

  for (const entry of header.split(',')) {
    const parts = entry.split(';').map(part => part.trim());
    if (parts[0] !== metric) {
      continue;
    }
    for (const param of parts.slice(1)) {
      const match = DURATION_PARAM.exec(param);
      if (match) {
        return Number(match[1]);
      }
    }
  }

  return null;
}

export interface ProxyMeter {
  /** Proxied requests observed while this meter was active. */
  requests: number;
  /** Summed git-host time across those requests, from Server-Timing. */
  upstreamMs: number;
  /** False means `upstreamMs` is unknown, not zero, and must be reported as absent. */
  upstreamMeasured: boolean;
}

export function createProxyMeter(): ProxyMeter {
  return { requests: 0, upstreamMs: 0, upstreamMeasured: false };
}

/**
 * Folds one proxied response into the meter, failures included. Not
 * exhaustive: `requestAllPages` bypasses it, but never runs during a save.
 */
export function recordProxyResponse(meter: ProxyMeter | null, response: Response): void {
  if (!meter) {
    return;
  }

  meter.requests += 1;

  const upstream = parseServerTimingMs(response.headers.get('Server-Timing'), 'upstream');
  if (upstream !== null) {
    meter.upstreamMs += upstream;
    meter.upstreamMeasured = true;
  }
}

interface MeasurableDataFile {
  raw?: string;
}

interface MeasurableAsset {
  fileObj?: { size?: number };
}

/**
 * Payload size of one save, so a slow save can be told apart from a big one.
 * Encoded, because `raw.length` counts UTF-16 code units.
 */
export function measurePayloadBytes(
  dataFiles: MeasurableDataFile[] = [],
  assets: MeasurableAsset[] = [],
): number {
  const encoder = typeof TextEncoder === 'undefined' ? null : new TextEncoder();
  let bytes = 0;

  for (const file of dataFiles) {
    if (typeof file?.raw === 'string') {
      bytes += encoder ? encoder.encode(file.raw).length : file.raw.length;
    }
  }

  for (const asset of assets) {
    if (typeof asset?.fileObj?.size === 'number') {
      bytes += asset.fileObj.size;
    }
  }

  return bytes;
}
