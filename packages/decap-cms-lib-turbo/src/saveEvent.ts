/**
 * The `cms_entry_saved` event, and the measurement around a save that feeds
 * it.
 */
import { branchFromContentKey, generateContentKey } from 'decap-cms-lib-util';

import { createProxyMeter, measurePayloadBytes, type ProxyMeter } from './saveMetrics';
import { recordCmsEvent } from './telemetry';

export interface TelemetryTarget {
  baseUrl: string;
  anonKey: string;
  accessToken: string | null;
  siteId: string;
}

export interface MeteredSave<T> {
  result: T;
  meter: ProxyMeter;
  durationMs: number;
}

/**
 * Runs a save with `host.proxyMeter` armed for its duration, so every
 * proxied response is folded into it and `cms_entry_saved` can report how
 * many round trips that one save cost and how much of the wait was the git
 * host's own time.
 *
 * Timed around the whole save rather than around the network calls
 * themselves, so the number includes lock acquisition — which is time the
 * editor waits with the save spinner up, whatever it is spent on.
 */
export async function meterSave<T>(
  host: { proxyMeter: ProxyMeter | null },
  save: () => Promise<T>,
): Promise<MeteredSave<T>> {
  const meter = createProxyMeter();
  host.proxyMeter = meter;
  const startedAt = Date.now();

  let result: T;
  try {
    result = await save();
  } finally {
    host.proxyMeter = null;
  }

  return { result, meter, durationMs: Date.now() - startedAt };
}

/**
 * The branch a save actually committed to, which is not the site's branch
 * for an editorial-workflow save — that goes to the entry's own
 * `cms/<collection>/<slug>` branch. Logging the site's branch made a draft
 * read as a publish in the org's activity feed (decap-turbo
 * docs/pre-production-review-findings.md L8).
 *
 * `result.branch` is authoritative when the one-call commit endpoint
 * answered; otherwise it is derived the same way the base backends'
 * persistFiles does. The content key only feeds telemetry, so `contentKey`
 * must never be the thing that breaks a save.
 */
export function savedBranch(
  result: unknown,
  options: { useWorkflow?: boolean; collectionName?: string },
  entry: { dataFiles?: { slug?: string }[] },
  siteBranch: string,
  contentKey: (collection: string, slug: string) => string = generateContentKey,
): string {
  const committedBranch = (result as { branch?: unknown } | undefined)?.branch;
  if (typeof committedBranch === 'string' && committedBranch) {
    return committedBranch;
  }
  return options.useWorkflow
    ? branchFromContentKey(
        contentKey(options.collectionName as string, entry.dataFiles?.[0]?.slug as string),
      )
    : siteBranch;
}

/**
 * Records a completed save. Deliberately does not write the cache: the commit
 * moves the branch HEAD, and `reloadEntriesAfterPersist` makes core re-run
 * loadEntries immediately after a save, so the very next allEntriesByFolder
 * syncs against the new HEAD and materialises the saved entry server-side.
 * Writing from here cannot work anyway: core's dataFiles carry no `id`, so
 * any row written would keep its pre-save blob sha.
 */
export function recordSaveEvent(
  target: TelemetryTarget,
  entry: { dataFiles?: { slug?: string; path?: string }[]; assets?: unknown[] },
  options: { useWorkflow?: boolean; collectionName?: string },
  save: MeteredSave<unknown> & { branch: string },
) {
  if (!save.result || !entry.dataFiles || entry.dataFiles.length === 0) {
    return;
  }

  recordCmsEvent(
    target.baseUrl,
    target.anonKey,
    target.accessToken,
    'cms_entry_saved',
    target.siteId,
    {
      collection: options.collectionName,
      slug: entry.dataFiles[0].slug,
      path: entry.dataFiles[0].path,
      branch: save.branch,
      // Whether this was an editorial-workflow draft. The branch alone can't
      // say so — a site is free to publish from a `cms/...` branch.
      workflow: options.useWorkflow === true,
      // No authorEmail. It was a second copy of an email the row already
      // identifies through the server-derived user_id, and the activity feed's
      // fallback to it never fired (decap-turbo H12). The server drops the key
      // regardless, so an older bundle sending it stores nothing either.
      // Baseline for the one-call commit endpoint (decap-turbo
      // docs/deploy-status-plan.md B5 -> B1): `requests` is the headline, and
      // durationMs minus upstreamMs is the share of the wait that collapsing
      // them removes.
      durationMs: save.durationMs,
      requests: save.meter.requests,
      // Omitted rather than sent as 0 when no response carried a readable
      // Server-Timing, so "not measured" never averages in as "instant".
      ...(save.meter.upstreamMeasured && { upstreamMs: Math.round(save.meter.upstreamMs) }),
      files: entry.dataFiles.length + (entry.assets?.length ?? 0),
      bytes: measurePayloadBytes(entry.dataFiles as never, entry.assets as never),
    },
  );
}
