/**
 * File Manager for S3-compatible storage
 * Provides high-level operations for file management
 */

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

  constructor({ edgeBaseUrl, getAccessToken, getActiveSiteId, publicUrlPrefix }: FileManagerOptions) {
    this.client = new S3Client({ edgeBaseUrl, getAccessToken, getActiveSiteId });
    this.publicUrlPrefix = publicUrlPrefix;
  }

  /**
   * List files and "folders" directly under a given path
   */
  async listFiles(path = '/'): Promise<S3File[]> {
    try {
      return await this.client.listAllObjects(pathToPrefix(path));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Filter files to only include images
   */
  filterImageFiles(files: S3File[]): S3File[] {
    return files.filter(file => {
      if (file.IsDirectory) return false;
      const ext = file.ObjectName.split('.').pop()?.toLowerCase();
      return ext && IMAGE_EXTENSIONS.includes(ext);
    });
  }

  /**
   * Get files with public URLs
   */
  async getFilesWithUrls(path = '/', imagesOnly = false): Promise<AddressedMediaFile[]> {
    const files = await this.listFiles(path);
    const filtered = imagesOnly ? this.filterImageFiles(files) : files;

    return filtered.map(file => ({
      ...file,
      publicUrl: this.client.generatePublicUrl(this.publicUrlPrefix, file.Key),
    }));
  }

  /**
   * Upload a file to a specific path
   */
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

  /**
   * Delete a file by its full key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.deleteFile(key);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get parent directory path
   */
  getParentPath(currentPath: string): string {
    if (currentPath === '/') return '/';
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    return parts.length === 0 ? '/' : `/${parts.join('/')}/`;
  }

  /**
   * Normalize a path
   */
  normalizePath(path: string): string {
    if (!path || path === '') return '/';
    if (!path.startsWith('/')) path = '/' + path;
    if (path !== '/' && !path.endsWith('/')) path = path + '/';
    return path.replace(/\/+/g, '/');
  }
}
