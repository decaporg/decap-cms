/**
 * Read-only view of Turbo's content cache.
 *
 * NOTE: byte-for-byte the same as decap-cms-backend-turbo-github's copy. The
 * two should collapse into one shared module — see
 * decap-turbo/docs/caching-project-breaking-changes.md. They are duplicated
 * for now rather than moved into decap-cms-lib-util, because the `data` table
 * is Turbo's schema and not something generic Decap infrastructure should know
 * about; a dedicated shared package is the right home and is follow-up work.
 * Until then, changes here must be mirrored.
 *
 * Every write method that used to live here — validateFiles,
 * insertDbFilesBatch, insertDbFile, removeDbFiles, updateEntriesAfterSave —
 * was deleted when the `gh` function's `_content/sync` endpoint took over
 * ownership of the cache. That move deleted, rather than fixed, four defects
 * at once: the unbounded 500-wide Promise.all that tripped GitHub's
 * 100-concurrent secondary limit, the missing per-file error isolation that
 * discarded up to 500 files of fetched work on a single failure, the
 * `file_id: undefined` drift that left every saved row carrying its pre-save
 * blob sha, and the rename bug that cached new content under the old path.
 *
 * The browser now has no write access to `public.data` at all — the INSERT,
 * UPDATE and DELETE policies were dropped server-side.
 *
 * See decap-turbo/docs/caching-and-github-api-strategy.md §3.4.
 */
export class SupabaseClient {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseAccessToken: string | null;
  branch: string;
  repo: string;
  siteId: string;

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string,
    branch: string,
    repo: string,
    siteId: string,
    supabaseAccessToken: string | null = null,
  ) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.branch = branch;
    this.repo = repo;
    this.siteId = siteId;
    this.supabaseAccessToken = supabaseAccessToken;
  }

  setAccessToken(token: string | null) {
    this.supabaseAccessToken = token;
  }

  buildUrl(query = '') {
    return `${this.supabaseUrl}${query}`;
  }

  buildScopedQuery(collection: string, extraParams: Record<string, string> = {}) {
    // `collections` is a set, not a column in the row's identity: one path is
    // one row, tagged with every collection that contains it. This is what
    // removed the 623 duplicate rows a nested parent/child pair used to
    // produce on moc-www, and with them the duplicate GitHub fetches.
    // PostgREST spells array-contains `cs.{a,b}`; the braces are literal.
    const params = new URLSearchParams({
      repo: `eq.${this.repo}`,
      site_id: `eq.${this.siteId}`,
      branch: `eq.${this.branch}`,
      collections: `cs.{${JSON.stringify(collection)}}`,
    });

    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });

    return `?${params.toString()}`;
  }

  async fetchDbPaginated(uri: string, batchSize = 500) {
    const allResults: any[] = [];
    let rangeStart = 0;
    let hasMore = true;

    while (hasMore) {
      const rangeEnd = rangeStart + batchSize - 1;

      try {
        const response = await fetch(this.buildUrl(uri), {
          method: 'GET',
          headers: {
            apikey: this.supabaseAnonKey,
            Authorization: `Bearer ${this.supabaseAccessToken || this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Range-Unit': 'items',
            Range: `${rangeStart}-${rangeEnd}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Supabase error:', error);
          throw new Error(`Supabase request failed: ${error.message || response.statusText}`);
        }

        const text = await response.text();
        const results = text ? JSON.parse(text) : [];

        allResults.push(...results);

        hasMore = results.length === batchSize;
        rangeStart += batchSize;
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error);
        throw error;
      }
    }

    return allResults;
  }

  async fetchEntryByPath(path: string) {
    const params = new URLSearchParams({
      repo: `eq.${this.repo}`,
      site_id: `eq.${this.siteId}`,
      branch: `eq.${this.branch}`,
      file_path: `eq.${path}`,
    });
    const results = await this.fetchDbPaginated(`?${params.toString()}`);
    if (results.length === 0) return null;
    const data = results[0];
    return {
      file: data.file_meta,
      data: data.file_data,
    };
  }

  async fetchEntries(collection: string, searchTerm?: string) {
    const response = await this.fetchDbPaginated(
      this.buildScopedQuery(collection, searchTerm ? { file_data: `ilike.%${searchTerm}%` } : {}),
    );

    return response.map((data: any) => ({
      file: data.file_meta,
      data: data.file_data,
    }));
  }
}
