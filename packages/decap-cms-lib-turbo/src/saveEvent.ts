/** The `cms_entry_saved` event, and the measurement around a save that feeds it. */
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
 * Runs a save with `host.proxyMeter` armed, so `cms_entry_saved` can report its
 * round trips and git-host time. Timed around the whole save, lock wait included.
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
 * The branch a save committed to: an editorial-workflow save goes to the
 * entry's own `cms/<collection>/<slug>` branch, not the site's, and logging the
 * site's branch made a draft read as a publish in the activity feed.
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
 * Records a completed save. Deliberately does not write the cache: core
 * reloads entries after a save, and that sync materialises the new HEAD.
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
