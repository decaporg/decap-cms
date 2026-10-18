/**
 * The read side of Turbo's content cache, as the backends use it: ask the
 * server to sync a collection, then read it from PostgREST.
 */
import { collectionKeyForFiles } from 'decap-cms-lib-util';

import type { ScopedFetch } from './scopedFetch';
import type { SupabaseClient } from './supabase';

export interface ContentCacheOptions {
  supabase: SupabaseClient;
  /** The backend's scoped fetch, for the `_content/*` routes. */
  fetch: ScopedFetch;
  apiRoot: string;
  /** Read per call: `authenticate` may replace the branch with the repo's default. */
  getBranch: () => string;
  /** The git host's name, for the warnings that say where a read went instead. */
  host: string;
  /**
   * Read the collection concurrently with the sync and keep that read when
   * the server reports `fresh`; see `allEntriesByFolder`.
   */
  speculativeRead?: boolean;
}

export type SyncResult = {
  fresh?: boolean;
  deferred?: boolean;
  rate_limited?: { remaining?: number };
} | null;

export class TurboContentCache {
  supabase: SupabaseClient;
  private readonly fetch: ScopedFetch;
  private readonly apiRoot: string;
  private readonly getBranch: () => string;
  private readonly host: string;
  private readonly speculativeRead: boolean;

  constructor(options: ContentCacheOptions) {
    this.supabase = options.supabase;
    this.fetch = options.fetch;
    this.apiRoot = options.apiRoot;
    this.getBranch = options.getBranch;
    this.host = options.host;
    this.speculativeRead = options.speculativeRead === true;
  }

  /** Asks Turbo to make the cache correct for this collection as of the branch's HEAD. */
  async syncCollection(
    collection: string,
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
  ): Promise<SyncResult> {
    return this.postCollectionSync({
      name: collection,
      folder,
      extension,
      depth,
      // Sent as source + flags rather than a stringified literal so the server
      // can rebuild the exact RegExp without parsing `/.../flags`.
      ...(pathRegex && { pathRegexSource: pathRegex.source, pathRegexFlags: pathRegex.flags }),
    });
  }

  async postCollectionSync(collection: Record<string, unknown>): Promise<SyncResult> {
    const response = await this.fetch(`${this.apiRoot}/_content/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, branch: this.getBranch() }),
    });
    const result = (await response.json()) as SyncResult;

    // The server skips the sync when the git host budget is low; say so, or
    // the only symptom is a silently short collection.
    if (result?.deferred) {
      console.warn(
        `Turbo deferred the sync for "${collection.name}": the ${this.host} API budget is low ` +
          `(${result.rate_limited?.remaining} left). Showing cached content; it will catch up ` +
          'once the budget recovers.',
      );
    }

    return result;
  }

  /**
   * Caches the i18n locale files the collection listing leaves out
   * (`collectionRegex` keeps only the default locale), so an entry open does
   * not read every other locale from the git host. Its own collection key, so
   * `fetchEntries` still returns one row per entry. Not awaited.
   */
  private warmLocaleSiblings(
    folder: string,
    extension: string,
    depth: number,
    localeSiblingRegex?: RegExp,
  ) {
    if (!localeSiblingRegex) {
      return;
    }

    const collection = `${folder}:${extension}:${depth}:${localeSiblingRegex.toString()}`;
    // A prefetch: the entry open reads from the git host fine without it.
    this.syncCollection(collection, folder, extension, depth, localeSiblingRegex).catch(
      () => undefined,
    );
  }

  async allEntriesByFolder(
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
    searchTerm?: string,
    localeSiblingRegex?: RegExp,
  ) {
    const collection = `${folder}:${extension}:${depth}:${pathRegex?.toString() || 'all'}`;

    this.warmLocaleSiblings(folder, extension, depth, localeSiblingRegex);

    const syncPromise = this.syncCollection(collection, folder, extension, depth, pathRegex);

    // Read alongside the sync, which costs more than the read even when it has
    // nothing to do. A failure is swallowed to `null`: the authoritative read
    // below would have served it, and handling it inline keeps a discarded read
    // from becoming an unhandled rejection.
    const speculativeRead = this.speculativeRead
      ? this.supabase.fetchEntries(collection, searchTerm).then(
          rows => rows,
          () => null,
        )
      : null;

    const sync = await syncPromise;

    // `fresh` means the server wrote nothing, so the concurrent read cannot
    // have missed anything; anything else may predate a write, so read again.
    const entries =
      (sync?.fresh && speculativeRead ? await speculativeRead : null) ??
      (await this.supabase.fetchEntries(collection, searchTerm));

    // By code unit, not localeCompare, so the order is stable across locales.
    entries.sort((a, b) => {
      const pathA = String(a.file?.path ?? '');
      const pathB = String(b.file?.path ?? '');
      return pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
    });

    return entries;
  }

  /** Files collections, through the folder sync with an explicit path list. */
  async entriesByFiles(files: { path: string; label?: string }[]) {
    const paths = files.map(file => file.path);
    if (paths.length === 0) {
      return [];
    }

    const collection = collectionKeyForFiles(paths);
    await this.postCollectionSync({ name: collection, files: paths });

    const entries = await this.supabase.fetchEntries(collection);
    const byPath = new Map(entries.map(entry => [String(entry.file?.path), entry]));

    // Every configured file must produce an entry, even one not in the repo
    // yet: saving that empty entry is how the file gets created. Config order.
    return files.map(file => byPath.get(file.path) ?? { file: { ...file, id: null }, data: '' });
  }

  /**
   * Reads one entry, verifying the cached row is current before trusting it,
   * and falling back to `readFromHost` otherwise.
   *
   * A stale read here is a lost update, not just stale display: a save rebases
   * onto the branch's current head and rewrites the edited path, so saving
   * stale content is a fast-forward commit that silently reverts whoever
   * committed in between.
   */
  async getEntry<T>(path: string, readFromHost: () => Promise<T>) {
    const cached = await this.supabase.fetchEntryByPath(path);
    if (!cached) {
      return readFromHost();
    }

    try {
      const response = await this.fetch(`${this.apiRoot}/_content/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, branch: this.getBranch() }),
      });
      const { fresh } = await response.json();
      if (fresh) {
        return cached;
      }
    } catch (error) {
      // Falling through to the git host on an unreachable check is the safe
      // direction: it costs requests, where trusting the cache costs edits.
      console.warn(`Turbo entry freshness check failed, reading from ${this.host}`, error);
    }

    return readFromHost();
  }
}
