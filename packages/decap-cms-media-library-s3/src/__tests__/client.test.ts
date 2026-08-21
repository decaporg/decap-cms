/**
 * Tests for S3-compatible API Client
 */

import { S3Client } from '../api/client';

// Mock fetch
global.fetch = jest.fn();

function xmlHeaders() {
  return new Map([['content-type', 'application/xml']]);
}

const SINGLE_PAGE_LIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Name>my-bucket</Name>
  <Prefix>images/</Prefix>
  <Delimiter>/</Delimiter>
  <IsTruncated>false</IsTruncated>
  <Contents>
    <Key>images/file.jpg</Key>
    <LastModified>2024-01-01T00:00:00.000Z</LastModified>
    <ETag>"abc123"</ETag>
    <Size>1024</Size>
  </Contents>
  <CommonPrefixes>
    <Prefix>images/subfolder/</Prefix>
  </CommonPrefixes>
</ListBucketResult>`;

const TRUNCATED_PAGE_1_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Name>my-bucket</Name>
  <Prefix></Prefix>
  <IsTruncated>true</IsTruncated>
  <NextContinuationToken>token-page-2</NextContinuationToken>
  <Contents>
    <Key>a.jpg</Key>
    <LastModified>2024-01-01T00:00:00.000Z</LastModified>
    <ETag>"a"</ETag>
    <Size>10</Size>
  </Contents>
</ListBucketResult>`;

const TRUNCATED_PAGE_2_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Name>my-bucket</Name>
  <Prefix></Prefix>
  <IsTruncated>false</IsTruncated>
  <Contents>
    <Key>b.jpg</Key>
    <LastModified>2024-01-02T00:00:00.000Z</LastModified>
    <ETag>"b"</ETag>
    <Size>20</Size>
  </Contents>
</ListBucketResult>`;

describe('S3Client', () => {
  const getAccessToken = jest.fn(async () => 'test-access-token');
  const getActiveSiteId = jest.fn(async () => 'test-site-id');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct parameters', () => {
    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    expect(client).toBeTruthy();
  });

  it('should list objects and parse Contents + CommonPrefixes from XML', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: xmlHeaders(),
      text: async () => SINGLE_PAGE_LIST_XML,
    });

    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    const result = await client.listObjects('images/');

    expect(result.isTruncated).toBe(false);
    expect(result.files).toHaveLength(2);

    const folder = result.files.find(f => f.IsDirectory);
    expect(folder).toMatchObject({ Key: 'images/subfolder/', IsDirectory: true, ObjectName: 'subfolder' });

    const file = result.files.find(f => !f.IsDirectory);
    expect(file).toMatchObject({
      Key: 'images/file.jpg',
      Size: 1024,
      ETag: 'abc123',
      IsDirectory: false,
      ObjectName: 'file.jpg',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('list-type=2'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
          'x-site-id': 'test-site-id',
        }),
      }),
    );
  });

  it('should follow pagination via listAllObjects until IsTruncated is false', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, headers: xmlHeaders(), text: async () => TRUNCATED_PAGE_1_XML })
      .mockResolvedValueOnce({ ok: true, headers: xmlHeaders(), text: async () => TRUNCATED_PAGE_2_XML });

    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    const files = await client.listAllObjects('');

    expect(files.map(f => f.Key)).toEqual(['a.jpg', 'b.jpg']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('continuation-token=token-page-2'),
      expect.anything(),
    );
  });

  it('should handle API errors on list', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: { entries: () => [] },
      text: async () => 'Forbidden',
    });

    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    await expect(client.listObjects('')).rejects.toThrow('S3 API error: 403');
  });

  it('should upload a file with a PUT request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, headers: { entries: () => [] } });

    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    const file = new Blob(['hello'], { type: 'text/plain' });
    await client.uploadFile('images/hello.txt', file);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://edge.example.test/functions/v1/integrations/s3/images/hello.txt',
      expect.objectContaining({ method: 'PUT', body: file }),
    );
  });

  it('should delete a file with a DELETE request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, headers: { entries: () => [] } });

    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    await client.deleteFile('images/hello.txt');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://edge.example.test/functions/v1/integrations/s3/images/hello.txt',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('should treat a 404 on delete as success (already gone)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { entries: () => [] },
    });

    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    await expect(client.deleteFile('images/gone.txt')).resolves.toBeUndefined();
  });

  it('should generate public URL correctly', () => {
    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    const url = client.generatePublicUrl('https://cdn.example.com', 'folder/file.jpg');

    expect(url).toBe('https://cdn.example.com/folder/file.jpg');
  });

  it('should handle URL generation with trailing slash and leading slash key', () => {
    const client = new S3Client({
      edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
      getAccessToken,
      getActiveSiteId,
    });

    const url = client.generatePublicUrl('https://cdn.example.com/', '/folder/file.jpg');

    expect(url).toBe('https://cdn.example.com/folder/file.jpg');
  });
});
