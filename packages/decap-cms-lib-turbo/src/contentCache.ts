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

  /**
   * Asks Turbo to make the cache correct for this collection as of the
   * branch's current HEAD. The server owns tree reading, blob fetching and
   * materialisation; this call is the only thing standing between the client
   * and a plain PostgREST read.
   */
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

    // The server declines to fan out when the organization's git host budget
    // is near its floor, so an editor's own requests keep working. The read
    // below still happens and serves whatever is cached — the same outcome as
    // losing the single-flight race — but a silently short collection is worth
    // saying out loud, because otherwise the only symptom is missing entries.
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
   * Caches the i18n locale files the collection listing leaves out.
   *
   * `collectionRegex` narrows a listing to the default locale — one card per
   * entry is what a list wants — so with `structure: multiple_files` only
   * `slug.en.md` was ever ingested. The editor reads every locale as its own
   * file, so `slug.de.md` and `slug.si.md` missed the cache on every open and
   * fell through to the git host: a tree read plus a blob read per locale,
   * measured at ~800ms of an entry open that otherwise cost ~1s.
   *
   * Its own collection key, not the listing's, so `fetchEntries` still returns
   * one row per entry — the sibling rows are found by `fetchEntryByPath`,
   * which matches on path alone and does not care which collection tagged
   * them. Not awaited: nothing on this load needs it, and the entry it serves
   * is a human click away, by which time the sync has long finished.
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
    // Swallowed rather than surfaced: this is a prefetch, and the entry open
    // it optimises reads from the git host perfectly well without it.
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

    // One request, in place of a tree listing plus two git host calls per
    // entry driven from the browser — which cost 2,001 requests for a
    // 1,000-entry collection, against a GitHub installation budget of
    // 5,000/hour.
    const syncPromise = this.syncCollection(collection, folder, extension, depth, pathRegex);

    // Started alongside the cache read rather than awaited before it. The sync
    // costs 1.4s even when it has nothing to do — it revalidates the branch
    // head through the proxy, which charges a fixed preamble per request —
    // while the read itself is ~300ms, so waiting for one before starting the
    // other spent the read's whole duration for nothing on every warm load.
    //
    // Speculative, and its failure is swallowed to `null` here: a read issued
    // before the sync answered must never be the reason a load fails, because
    // the authoritative read below would have served it. Handling it inline
    // also keeps it from ever becoming an unhandled rejection on the branch
    // that discards it.
    const speculativeRead = this.speculativeRead
      ? this.supabase.fetchEntries(collection, searchTerm).then(
          rows => rows,
          () => null,
        )
      : null;

    const sync = await syncPromise;

    // `fresh` means the branch head already matched the ingested sha and no
    // row was missing metadata — the server wrote nothing, so the concurrent
    // read cannot have missed anything. Anything else (a sync that ingested,
    // a deferred sync) means the read may predate a write, so it is discarded
    // and the collection is read again. Correctness first; the saved round
    // trip is only ever claimed when the server says nothing changed.
    const entries =
      (sync?.fresh && speculativeRead ? await speculativeRead : null) ??
      (await this.supabase.fetchEntries(collection, searchTerm));

    // Sorted by path so entry order is stable across loads. Compared by code
    // unit rather than with localeCompare, so the order does not depend on the
    // editor's locale.
    entries.sort((a, b) => {
      const pathA = String(a.file?.path ?? '');
      const pathB = String(b.file?.path ?? '');
      return pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
    });

    return entries;
  }

  /**
   * Files collections (`type: files` in config.yml) were the last read path
   * still going straight to the git host: the base backends fetch a blob AND a
   * commits lookup per file on every single load, with no cache at all.
   * Across the live beta that is 77 configured file paths, so ~154 requests
   * per full CMS load, forever.
   *
   * They share the whole sync pipeline with folder collections — tree read,
   * sha-addressed blob store, batched metadata, atomic reconcile,
   * single-flight — differing only in how paths are selected, so the server
   * takes an explicit path list instead of a folder selector.
   */
  async entriesByFiles(files: { path: string; label?: string }[]) {
    const paths = files.map(file => file.path);
    if (paths.length === 0) {
      return [];
    }

    const collection = collectionKeyForFiles(paths);
    await this.postCollectionSync({ name: collection, files: paths });

    const entries = await this.supabase.fetchEntries(collection);
    const byPath = new Map(entries.map(entry => [String(entry.file?.path), entry]));

    // Every configured file must produce an entry, including ones that do not
    // exist in the repo yet. A files collection is a fixed list of documents
    // the editor declared, and an entry that has never been saved is how you
    // create it — dropping it removes the only way to add the file at all.
    // The base backends get this for free by catching the read error and
    // yielding empty content; syncing from a tree has to reinstate it
    // explicitly, because a path with no blob simply is not in the tree.
    //
    // Order follows the config, not the path: for a files collection that
    // ordering is the author's choice, not an accident of the filesystem.
    return files.map(file => byPath.get(file.path) ?? { file: { ...file, id: null }, data: '' });
  }

  /**
   * Reads one entry, verifying the cached row is current before trusting it,
   * and falling back to `readFromHost` otherwise.
   *
   * The check is not cosmetic. Collection loads revalidate the branch head on
   * every sync, but this path is reached directly — core's loadEntry when an
   * editor deep-links to an entry, and once per non-default locale for
   * multiple_files/multiple_folders i18n — so without it the cache is trusted
   * unconditionally.
   *
   * A stale read here is a lost update, not just stale display: a save rebases
   * onto the branch's current head and rewrites the edited path, so saving
   * stale content is a fast-forward commit that silently reverts whoever
   * committed in between.
   *
   * Server-side this costs one conditional request against the shared
   * per-branch ETag.
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
