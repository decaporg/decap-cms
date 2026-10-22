// High-level file operations for S3-compatible storage.

import { S3Client } from './client';

import type { S3File, AddressedMediaFile } from '../types';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];

export interface FileManagerOptions {
  edgeBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  getActiveSiteId: () => Promise<string | null>;
  publicUrlPrefix: string;
}

// S3 has no real directories — "folders" are emulated via key prefixes.
// A UI path like "/images/" maps to the key prefix "images/", and the
// bucket root ("/") maps to the empty prefix.
function pathToPrefix(path: string): string {
  if (!path || path === '/') return '';
  return path.replace(/^\/+/, '').replace(/\/*$/, '/');
}

export class S3FileManager {
  private client: S3Client;
  private publicUrlPrefix: string;

  constructor({
    edgeBaseUrl,
    getAccessToken,
    getActiveSiteId,
    publicUrlPrefix,
  }: FileManagerOptions) {
    this.client = new S3Client({ edgeBaseUrl, getAccessToken, getActiveSiteId });
    this.publicUrlPrefix = publicUrlPrefix;
  }

  async listFiles(path = '/'): Promise<S3File[]> {
    try {
      return await this.client.listAllObjects(pathToPrefix(path));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  filterImageFiles(files: S3File[]): S3File[] {
    return files.filter(file => {
      if (file.IsDirectory) return false;
      const ext = file.ObjectName.split('.').pop()?.toLowerCase();
      return ext && IMAGE_EXTENSIONS.includes(ext);
    });
  }

  async getFilesWithUrls(path = '/', imagesOnly = false): Promise<AddressedMediaFile[]> {
    const files = await this.listFiles(path);
    const filtered = imagesOnly ? this.filterImageFiles(files) : files;

    return filtered.map(file => ({
      ...file,
      publicUrl: this.client.generatePublicUrl(this.publicUrlPrefix, file.Key),
    }));
  }

  async uploadFile(filePath: string, file: Blob, fileName: string): Promise<string> {
    try {
      const key = `${pathToPrefix(filePath)}${fileName}`;
      await this.client.uploadFile(key, file);
      return this.client.generatePublicUrl(this.publicUrlPrefix, key);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.deleteFile(key);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  getParentPath(currentPath: string): string {
    if (currentPath === '/') return '/';
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    return parts.length === 0 ? '/' : `/${parts.join('/')}/`;
  }

  normalizePath(path: string): string {
    if (!path || path === '') return '/';
    if (!path.startsWith('/')) path = '/' + path;
    if (path !== '/' && !path.endsWith('/')) path = path + '/';
    return path.replace(/\/+/g, '/');
  }
}
