/**
 * Measurement for the save path, reported as props on `cms_entry_saved`.
 *
 * NOTE: byte-for-byte the same as decap-cms-backend-turbo-github's copy, for
 * the same reason supabase.ts is duplicated — changes here must be mirrored.
 *
 * The question this answers: of the time an editor waits on a save, how much
 * is the git host and how much is round trips? Today one save is N+4
 * sequential browser -> edge -> git-host requests, so if `upstreamMs` is a
 * small fraction of `durationMs`, collapsing them into a single server-side
 * commit is the win — and if it isn't, it wouldn't be. See
 * decap-turbo/docs/deploy-status-plan.md (B5 -> B1).
 */

/** Matches one `dur=NN` parameter, tolerating whitespace and a float value. */
const DURATION_PARAM = /^dur\s*=\s*([0-9]*\.?[0-9]+)$/;

/**
 * Reads one metric out of a `Server-Timing` header, e.g. `upstream` from
 * `preamble;dur=12, upstream;dur=302, total;dur=316`.
 *
 * Returns null rather than 0 for "not present", so a missing header is never
 * mistaken for a genuinely instant request.
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
  /**
   * Whether any response actually carried a readable Server-Timing. False
   * means `upstreamMs` is not merely zero but unknown — an older edge function,
   * or a browser that stripped the header because it wasn't in the CORS expose
   * list — and it must be reported as absent, not as zero.
   */
  upstreamMeasured: boolean;
}

export function createProxyMeter(): ProxyMeter {
  return { requests: 0, upstreamMs: 0, upstreamMeasured: false };
}

/**
 * Folds one proxied response into the meter. Called for failures too: a
 * request that 500s still cost the editor the wait.
 *
 * Not exhaustive by design — `requestAllPages` reaches the network without
 * going through the metered request function. That path doesn't run during a
 * save, which is the only window a meter is ever active.
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
 *
 * Data files are encoded rather than measured by string length: `raw.length`
 * counts UTF-16 code units, which understates any non-ASCII content — and
 * non-ASCII content is the norm for most of our editors.
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
