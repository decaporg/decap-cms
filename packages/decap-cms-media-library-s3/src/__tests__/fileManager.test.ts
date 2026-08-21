/**
 * Tests for S3-compatible File Manager
 */

import { S3FileManager } from '../api/fileManager';

// Mock the S3Client
jest.mock('../api/client', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      listAllObjects: jest.fn(),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      generatePublicUrl: jest.fn((prefix, key) => `${prefix}/${key}`),
    })),
  };
});

describe('S3FileManager', () => {
  const mockConfig = {
    edgeBaseUrl: 'https://edge.example.test/functions/v1/integrations/s3',
    getAccessToken: jest.fn(async () => 'test-access-token'),
    getActiveSiteId: jest.fn(async () => 'test-site-id'),
    publicUrlPrefix: 'https://cdn.example.com',
  };

  it('should initialize with correct parameters', () => {
    const manager = new S3FileManager(mockConfig);
    expect(manager).toBeTruthy();
  });

  it('should filter image files correctly', () => {
    const manager = new S3FileManager(mockConfig);

    const files = [
      { Key: 'image.jpg', Size: 1024, LastModified: '2024-01-01T00:00:00Z', ETag: 'a', IsDirectory: false, ObjectName: 'image.jpg' },
      { Key: 'document.pdf', Size: 2048, LastModified: '2024-01-01T00:00:00Z', ETag: 'b', IsDirectory: false, ObjectName: 'document.pdf' },
      { Key: 'video.png', Size: 512, LastModified: '2024-01-01T00:00:00Z', ETag: 'c', IsDirectory: false, ObjectName: 'video.png' },
      { Key: 'folder/', Size: 0, LastModified: '', ETag: '', IsDirectory: true, ObjectName: 'folder' },
    ];

    const filtered = manager.filterImageFiles(files);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].ObjectName).toBe('image.jpg');
    expect(filtered[1].ObjectName).toBe('video.png');
  });

  it('should normalize paths correctly', () => {
    const manager = new S3FileManager(mockConfig);

    expect(manager.normalizePath('/')).toBe('/');
    expect(manager.normalizePath('folder')).toBe('/folder/');
    expect(manager.normalizePath('/folder')).toBe('/folder/');
    expect(manager.normalizePath('/folder/')).toBe('/folder/');
    expect(manager.normalizePath('')).toBe('/');
  });

  it('should get parent path correctly', () => {
    const manager = new S3FileManager(mockConfig);

    expect(manager.getParentPath('/')).toBe('/');
    expect(manager.getParentPath('/folder/')).toBe('/');
    expect(manager.getParentPath('/folder/subfolder/')).toBe('/folder/');
  });

  it('should map the bucket root path to an empty key prefix when listing', async () => {
    const manager = new S3FileManager(mockConfig);
    const listAllObjects = (manager as any).client.listAllObjects as jest.Mock;
    listAllObjects.mockResolvedValueOnce([]);

    await manager.listFiles('/');

    expect(listAllObjects).toHaveBeenCalledWith('');
  });

  it('should map a UI path to a trailing-slash key prefix when listing', async () => {
    const manager = new S3FileManager(mockConfig);
    const listAllObjects = (manager as any).client.listAllObjects as jest.Mock;
    listAllObjects.mockResolvedValueOnce([]);

    await manager.listFiles('/images/');

    expect(listAllObjects).toHaveBeenCalledWith('images/');
  });

  it('should upload a file under the current path prefix and return its public URL', async () => {
    const manager = new S3FileManager(mockConfig);
    const uploadFile = (manager as any).client.uploadFile as jest.Mock;
    uploadFile.mockResolvedValueOnce(undefined);

    const url = await manager.uploadFile('/images/', new Blob(['x']), 'cat.png');

    expect(uploadFile).toHaveBeenCalledWith('images/cat.png', expect.any(Blob));
    expect(url).toBe('https://cdn.example.com/images/cat.png');
  });
});
