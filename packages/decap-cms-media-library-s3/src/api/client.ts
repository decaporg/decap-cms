/**
 * HTTP Client for S3-compatible Storage APIs (via decap-turbo's edge-function proxy)
 * Handles authentication and request/response formatting. The actual AWS
 * SigV4 signing and provider credentials live server-side in the proxy —
 * this client only ever sends the caller's Decap session token and site id.
 */

import type { S3File } from '../types';

interface S3ClientOptions {
  edgeBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  getActiveSiteId: () => Promise<string | null>;
}

export interface ListObjectsResult {
  files: S3File[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
}

// Extracts the child segment directly under `prefix` from a full S3 key or
// CommonPrefix, e.g. ("images/2024/", "images/2024/cat.png") -> "cat.png".
function objectNameFromKey(key: string, prefix: string): string {
  const relative = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
  return relative.replace(/\/$/, '').split('/').pop() || relative;
}

function parseListObjectsXml(xml: string, prefix: string): ListObjectsResult {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Failed to parse S3 ListObjectsV2 response: ${parserError.textContent}`);
  }

  const files: S3File[] = [];

  // CommonPrefixes are the emulated "folders" produced by requesting with
  // Delimiter=/ — S3 has no real directories, only key prefixes.
  doc.querySelectorAll('CommonPrefixes > Prefix').forEach(node => {
    const key = node.textContent || '';
    if (!key || key === prefix) return;
    files.push({
      Key: key,
      Size: 0,
      LastModified: '',
      ETag: '',
      IsDirectory: true,
      ObjectName: objectNameFromKey(key, prefix),
    });
  });

  doc.querySelectorAll('Contents').forEach(node => {
    const key = node.querySelector('Key')?.textContent || '';
    // Skip the "directory marker" object some tools create for the prefix itself.
    if (!key || key === prefix) return;

    files.push({
      Key: key,
      Size: Number(node.querySelector('Size')?.textContent || 0),
      LastModified: node.querySelector('LastModified')?.textContent || '',
      ETag: (node.querySelector('ETag')?.textContent || '').replace(/^"|"$/g, ''),
      IsDirectory: false,
      ObjectName: objectNameFromKey(key, prefix),
    });
  });

  const isTruncated = doc.querySelector('IsTruncated')?.textContent === 'true';
  const nextContinuationToken = doc.querySelector('NextContinuationToken')?.textContent || null;

  return { files, isTruncated, nextContinuationToken };
}

export class S3Client {
  private edgeBaseUrl: string;
  private getAccessToken: () => Promise<string | null>;
  private getActiveSiteId: () => Promise<string | null>;

  constructor({ edgeBaseUrl, getAccessToken, getActiveSiteId }: S3ClientOptions) {
    this.edgeBaseUrl = edgeBaseUrl.replace(/\/+$/, '');
    this.getAccessToken = getAccessToken;
    this.getActiveSiteId = getActiveSiteId;
  }

  private async getHeaders(contentType?: string): Promise<HeadersInit> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Session token not found. Please authenticate first.');
    }

    const activeSiteId = await this.getActiveSiteId();
    if (!activeSiteId) {
      throw new Error('Active site id not found.');
    }

    return {
      Authorization: `Bearer ${accessToken}`,
      'x-site-id': activeSiteId,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    };
  }

  private buildUrl(query: Record<string, string> = {}): string {
    const url = new URL(this.edgeBaseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private buildObjectUrl(key: string): string {
    const normalizedKey = key.replace(/^\/+/, '');
    return `${this.edgeBaseUrl}/${normalizedKey}`;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const errorBody = await response.text();
    console.error('[S3 Client] API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
      headers: Object.fromEntries(response.headers.entries()),
    });
    throw new Error(`S3 API error: ${response.status} - ${errorBody}`);
  }

  /**
   * Lists objects/"folders" under a given key prefix using ListObjectsV2
   * with Delimiter=/, one page at a time (S3 caps a page at 1000 keys).
   */
  async listObjects(prefix: string, continuationToken?: string): Promise<ListObjectsResult> {
    const query: Record<string, string> = {
      'list-type': '2',
      delimiter: '/',
      prefix,
    };
    if (continuationToken) {
      query['continuation-token'] = continuationToken;
    }

    const url = this.buildUrl(query);
    const headers = await this.getHeaders();
    const response = await fetch(url, { method: 'GET', headers });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const xml = await response.text();
    return parseListObjectsXml(xml, prefix);
  }

  /**
   * Lists every object/"folder" under a prefix, following pagination until
   * IsTruncated is false. Unlike Bunny's storage API (single unpaginated
   * list), S3 buckets can easily exceed the 1000-key default page size.
   */
  async listAllObjects(prefix: string): Promise<S3File[]> {
    const allFiles: S3File[] = [];
    let continuationToken: string | undefined;

    do {
      const page = await this.listObjects(prefix, continuationToken);
      allFiles.push(...page.files);
      continuationToken = page.isTruncated ? page.nextContinuationToken || undefined : undefined;
    } while (continuationToken);

    return allFiles;
  }

  async uploadFile(key: string, file: Blob): Promise<void> {
    const url = this.buildObjectUrl(key);

    // Pass the Blob directly so the browser streams it instead of
    // materializing the whole file in memory via file.arrayBuffer().
    const response = await fetch(url, {
      method: 'PUT',
      headers: await this.getHeaders(file.type || 'application/octet-stream'),
      body: file,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const url = this.buildObjectUrl(key);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      await this.handleErrorResponse(response);
    }
  }

  /**
   * Builds the public URL for an inserted asset. S3/R2 buckets are private
   * by default, so `public_url_prefix` must point at a public bucket,
   * custom domain, or CDN already provisioned in front of the bucket.
   */
  generatePublicUrl(publicUrlPrefix: string, key: string): string {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    const cleanPrefix = publicUrlPrefix.endsWith('/')
      ? publicUrlPrefix.slice(0, -1)
      : publicUrlPrefix;
    return `${cleanPrefix}/${cleanKey}`;
  }
}
