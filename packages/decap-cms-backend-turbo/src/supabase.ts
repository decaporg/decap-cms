type ReadFile = (
  path: string,
  id: string | null | undefined,
  options: { parseText: boolean },
) => Promise<string | Blob>;

type ReadFileMetadata = (path: string, id: string | null | undefined) => Promise<any>;

type File = {
  type: string;
  id: string;
  name: string;
  path: string;
  size: number;
};

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
    const params = new URLSearchParams({
      repo: `eq.${this.repo}`,
      site_id: `eq.${this.siteId}`,
      branch: `eq.${this.branch}`,
      collection: `eq.${collection}`,
    });

    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });

    return `?${params.toString()}`;
  }

  async fetchDb(uri: string, method: string, body: any = null) {
    try {
      const response = await fetch(this.buildUrl(uri), {
        method: method || 'POST',
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAccessToken || this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Supabase error:', error);
        throw new Error(`Supabase request failed: ${error.message || response.statusText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error('Failed to fetch from Supabase:', error);
      throw error;
    }
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

        // Check if we got fewer results than requested, meaning we're done
        hasMore = results.length === batchSize;
        rangeStart += batchSize;
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error);
        throw error;
      }
    }

    // return [];

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
    console.log('Fetching entries from supabase for collection:', collection);
    const response = await this.fetchDbPaginated(
      this.buildScopedQuery(collection, searchTerm ? { file_data: `ilike.%${searchTerm}%` } : {}),
    );

    return response.map((data: any) => ({
      file: data.file_meta,
      data: data.file_data,
    }));
  }

  async fetchDbFiles(collection: string) {
    console.log('Fetching file list from supabase for collection:', collection);
    const response = await this.fetchDbPaginated(this.buildScopedQuery(collection, { select: 'file_id' }));
    return response;
  }

  async removeDbFiles(collection: string, fileIds: string[]) {
    console.log('Removing files from supabase with IDs:', fileIds);
    const fileIdsParam = fileIds.map(id => `"${id}"`).join(',');
    await this.fetchDb(this.buildScopedQuery(collection, { file_id: `in.(${fileIdsParam})` }), 'DELETE');
  }

  async insertDbFile(
    collection: string,
    fileId: string,
    filePath: string,
    fileMeta: any,
    fileData: string | Blob,
  ) {
    await this.fetchDb('', 'POST', {
      repo: this.repo,
      site_id: this.siteId,
      branch: this.branch,
      collection,
      file_id: fileId,
      file_path: filePath,
      file_meta: fileMeta,
      file_data: fileData,
    });
  }

  async insertDbFilesBatch(
    files: Array<{
      collection: string;
      fileId: string;
      filePath: string;
      fileMeta: any;
      fileData: string | Blob;
    }>,
  ) {
    const batch = files.map(file => ({
      repo: this.repo,
      site_id: this.siteId,
      branch: this.branch,
      collection: file.collection,
      file_id: file.fileId,
      file_path: file.filePath,
      file_meta: file.fileMeta,
      file_data: file.fileData,
    }));

    // Deduplicate batch to avoid "cannot affect row a second time" error
    const seen = new Map();
    const deduplicatedBatch = [];
    for (const item of batch) {
      const key = `${item.site_id}|${item.repo}|${item.branch}|${item.file_path}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        deduplicatedBatch.push(item);
      }
    }

    try {
      const response = await fetch(
        this.buildUrl('?on_conflict=site_id,repo,branch,file_path'),
        {
          method: 'POST',
          headers: {
            apikey: this.supabaseAnonKey,
            Authorization: `Bearer ${this.supabaseAccessToken || this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(deduplicatedBatch),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Supabase error:', error);
        throw new Error(`Supabase request failed: ${error.message || response.statusText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error('Failed to insert batch to Supabase:', error);
      throw error;
    }
  }

  async validateFiles(
    collection: string,
    files: File[],
    readFile: ReadFile,
    readFileMetadata: ReadFileMetadata,
  ) {
    let cacheOk = true;

    const dbFiles = await this.fetchDbFiles(collection);
    const fileIds = files.map(f => f.id);

    const dbFileIds = dbFiles.map((f: any) => f.file_id);
    const filesToRemove = dbFileIds.filter((id: string) => !fileIds.includes(id));
    if (filesToRemove.length > 0) {
      cacheOk = false;
      await this.removeDbFiles(collection, filesToRemove);
    }

    const filesToAdd = files.filter(f => !dbFileIds.includes(f.id));
    if (filesToAdd.length > 0) {
      console.log('Files to add:', filesToAdd.length);
      cacheOk = false;
    }

    // Process files in batches of 500
    const batchSize = 500;
    for (let i = 0; i < filesToAdd.length; i += batchSize) {
      const batch = filesToAdd.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          filesToAdd.length / batchSize,
        )}`,
      );

      // Read all files in the batch in parallel
      const loadedEntries = await Promise.all(
        batch.map(async file => {
          const [content, metadata] = await Promise.all([
            readFile(file.path, file.id, { parseText: true }),
            readFileMetadata(file.path, file.id),
          ]);

          return {
            collection,
            fileId: file.id,
            filePath: file.path,
            fileMeta: { ...file, ...metadata },
            fileData: content,
          };
        }),
      );

      // Insert entire batch in a single request
      await this.insertDbFilesBatch(loadedEntries);
    }

    if (cacheOk) {
      console.log('Cache is up to date for collection:', collection);
      return;
    }

    return;
  }

  async updateEntriesAfterSave(files: Array<{ path: string; raw: string; id: string }>) {
    console.log('Updating cache for persisted entries:', files.map(f => f.path));

    const batch: Array<{
      collection: string;
      fileId: string;
      filePath: string;
      fileMeta: any;
      fileData: string;
    }> = [];

    for (const file of files) {
      const params = new URLSearchParams({
        repo: `eq.${this.repo}`,
        site_id: `eq.${this.siteId}`,
        branch: `eq.${this.branch}`,
        file_path: `eq.${file.path}`,
      });

      const existingRows = await this.fetchDbPaginated(`?${params.toString()}`);
      if (existingRows.length === 0) {
        continue;
      }

      for (const row of existingRows) {
        batch.push({
          collection: row.collection,
          fileId: file.id,
          filePath: file.path,
          fileMeta: {
            ...(row.file_meta || {}),
            id: file.id,
            path: file.path,
            name: file.path.split('/').pop() || '',
            size: file.raw.length,
            type: 'blob',
          },
          fileData: file.raw,
        });
      }
    }

    if (batch.length > 0) {
      await this.insertDbFilesBatch(batch);
    }
  }
}
