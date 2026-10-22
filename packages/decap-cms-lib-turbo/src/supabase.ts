/**
 * Read-only view of Turbo's content cache: `_content/sync` is the only writer,
 * and the browser has no write access to `public.data` at all.
 */
/** The only columns the CMS reads; the rest of the row is server bookkeeping. */
const ROW_COLUMNS = 'file_meta,file_data';

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
    // `collections` is a set: one path is one row, tagged with every collection
    // that contains it. PostgREST spells array-contains `cs.{a,b}`.
    const params = new URLSearchParams({
      select: ROW_COLUMNS,
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
            // Row-level security reads the site from this header before the
            // JWT's active_site_id claim, which another tab on another site
            // can change under this one.
            'x-site-id': this.siteId,
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
      select: ROW_COLUMNS,
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
