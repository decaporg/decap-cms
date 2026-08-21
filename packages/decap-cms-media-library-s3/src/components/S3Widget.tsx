/**
 * Main S3-compatible Media Library Widget Component
 * Provides file browser interface integrated with Decap CMS
 */

import { useState, useEffect, useRef } from 'react';

import { S3FileManager } from '../api/fileManager';
import S3FileGrid from './FileGrid';
import S3FileBrowser from './FileBrowser';
import S3FileUpload from './FileUpload';
import {
  StyledWidget,
  StyledBackdrop,
  StyledContainer,
  StyledHeader,
  StyledHeaderTitle,
  StyledCloseButton,
  StyledError,
  StyledFileGridContainer,
  StyledLoading,
  StyledEmpty,
  StyledFooter,
  StyledButtonPrimary,
  StyledButtonSecondary,
} from './styles';

import type { AddressedMediaFile } from '../types';

// Supabase Edge Functions reject request bodies above this size before our
// code ever runs, so uploads must be rejected client-side with a clear
// message rather than surfacing an opaque gateway/edge-function error.
const DEFAULT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  }
  return `${(bytes / 1024).toFixed(0)}KB`;
}

interface S3WidgetProps {
  config: {
    public_url_prefix: string;
    root_path?: string;
    max_file_size?: number;
  };
  resolveRequestContext: () => Promise<{
    accessToken: string | null;
    activeSiteId: string | null;
    edgeBaseUrl: string | null;
  }>;
  onInsert: (value: string | string[]) => void;
  onClose: () => void;
  allowMultiple?: boolean;
  imagesOnly?: boolean;
  value?: string | string[];
}

export function S3Widget({
  config,
  resolveRequestContext,
  onInsert,
  onClose,
  allowMultiple = false,
  imagesOnly = false,
}: S3WidgetProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentPath, setCurrentPath] = useState<string>(config.root_path || '/');
  const [files, setFiles] = useState<AddressedMediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isManagerReady, setIsManagerReady] = useState(false);

  const fileManagerRef = useRef<S3FileManager | null>(null);
  const maxFileSize = config.max_file_size ?? DEFAULT_MAX_FILE_SIZE_BYTES;

  useEffect(() => {
    let isMounted = true;

    async function validateContext() {
      try {
        const context = await resolveRequestContext();
        if (!isMounted) {
          return;
        }

        if (!context.accessToken) {
          throw new Error('Session token not found. Please log in again.');
        }

        if (!context.activeSiteId) {
          throw new Error('Active site id is missing in backend configuration.');
        }

        if (!context.edgeBaseUrl) {
          throw new Error('Backend base URL is missing. Configure backend.base_url.');
        }

        setError(null);
        setIsAuthenticated(true);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setIsAuthenticated(false);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    validateContext();

    return () => {
      isMounted = false;
    };
  }, [resolveRequestContext]);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      fileManagerRef.current = null;
      setIsManagerReady(false);
      return;
    }

    async function initializeFileManager() {
      try {
        const context = await resolveRequestContext();
        if (!isMounted || !context.edgeBaseUrl) {
          return;
        }
        fileManagerRef.current = new S3FileManager({
          edgeBaseUrl: context.edgeBaseUrl,
          getAccessToken: async () => (await resolveRequestContext()).accessToken,
          getActiveSiteId: async () => (await resolveRequestContext()).activeSiteId,
          publicUrlPrefix: config.public_url_prefix,
        });
        setIsManagerReady(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[S3 Widget] Failed to initialize file manager:', errorMsg);
        setError(`Failed to initialize: ${errorMsg}`);
        setIsManagerReady(false);
      }
    }

    initializeFileManager();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, config.public_url_prefix, resolveRequestContext]);

  // Load files when path changes (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated || !isManagerReady || !fileManagerRef.current) {
      setIsLoading(false);
      return;
    }

    async function loadFiles() {
      try {
        setIsLoading(true);
        setError(null);
        const filesData = await fileManagerRef.current!.getFilesWithUrls(currentPath, imagesOnly);
        setFiles(filesData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[S3 Widget] Failed to load files:', errorMsg);
        setError(`Failed to load files: ${errorMsg}`);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadFiles();
  }, [currentPath, imagesOnly, isAuthenticated, isManagerReady]);

  function handleNavigate(path: string) {
    setCurrentPath(path);
    setSelectedFiles(new Set());
  }

  function handleParentDirectory() {
    if (!fileManagerRef.current) return;
    const parentPath = fileManagerRef.current.getParentPath(currentPath);
    handleNavigate(parentPath);
  }

  function handleSelectFile(filePath: string) {
    if (allowMultiple) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(filePath)) {
        newSelected.delete(filePath);
      } else {
        newSelected.add(filePath);
      }
      setSelectedFiles(newSelected);
    } else {
      setSelectedFiles(new Set([filePath]));
    }
  }

  function handleFileDoubleClick(file: AddressedMediaFile) {
    if (file.IsDirectory) {
      handleNavigate(`${currentPath}${file.ObjectName}/`.replace(/\/+/g, '/'));
    } else if (!allowMultiple) {
      // Auto-insert on double-click if single select
      onInsert(file.publicUrl);
      onClose();
    }
  }

  async function handleDeleteFile(key: string) {
    if (!fileManagerRef.current) return;
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      setError(null);
      await fileManagerRef.current.deleteFile(key);
      // Reload files after deletion
      const filesData = await fileManagerRef.current.getFilesWithUrls(currentPath, imagesOnly);
      setFiles(filesData);
      setSelectedFiles(prev => {
        const newSelected = new Set(prev);
        const deletedFile = files.find(f => f.Key === key);
        if (deletedFile) newSelected.delete(deletedFile.publicUrl);
        return newSelected;
      });
    } catch (err) {
      setError(`Failed to delete file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleUpload(uploadedFiles: File[]) {
    if (!fileManagerRef.current) return;

    const oversizedFile = uploadedFiles.find(file => file.size > maxFileSize);
    if (oversizedFile) {
      setError(
        `"${oversizedFile.name}" is ${formatBytes(oversizedFile.size)}, which exceeds the ` +
          `${formatBytes(maxFileSize)} upload limit. Please choose a smaller file.`,
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const urls: string[] = [];

    try {
      setError(null);
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const url = await fileManagerRef.current.uploadFile(currentPath, file, file.name);
        urls.push(url);
        setUploadProgress(Math.round(((i + 1) / uploadedFiles.length) * 100));
      }

      // Reload files after upload
      const filesData = await fileManagerRef.current.getFilesWithUrls(currentPath, imagesOnly);
      setFiles(filesData);

      // Select the newly uploaded file(s) rather than auto-inserting, so the
      // modal stays open and the user explicitly confirms with "Insert".
      setSelectedFiles(new Set(urls));
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  function handleInsertSelected() {
    const selectedUrls = Array.from(selectedFiles)
      .map(path => files.find(f => f.publicUrl === path))
      .filter(Boolean)
      .map(f => (f as AddressedMediaFile).publicUrl);

    if (selectedUrls.length === 0) {
      setError('Please select at least one file');
      return;
    }

    onInsert(allowMultiple ? selectedUrls : selectedUrls[0]);
    onClose();
  }

  if (!isAuthenticated) {
    return (
      <StyledWidget>
        <StyledContainer>
          <StyledHeader>
            <StyledHeaderTitle>S3 Media Library</StyledHeaderTitle>
            <StyledCloseButton onClick={onClose} title="Close">
              ✕
            </StyledCloseButton>
          </StyledHeader>
          <StyledEmpty>{error || 'Please authenticate in Decap CMS first.'}</StyledEmpty>
        </StyledContainer>
        <StyledBackdrop onClick={onClose} />
      </StyledWidget>
    );
  }

  // Main widget UI (after authentication)
  return (
    <StyledWidget>
      <StyledContainer>
        {/* Header */}
        <StyledHeader>
          <StyledHeaderTitle>S3 Media Library</StyledHeaderTitle>
          <StyledCloseButton onClick={onClose} title="Close">
            ✕
          </StyledCloseButton>
        </StyledHeader>

        {/* Error Message */}
        {error && <StyledError>{error}</StyledError>}

        {/* Navigation */}
        <S3FileBrowser
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onParentDirectory={handleParentDirectory}
        />

        {/* Upload Area */}
        <S3FileUpload
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          currentPath={currentPath}
          maxFileSizeLabel={formatBytes(maxFileSize)}
        />

        {/* File Grid */}
        <StyledFileGridContainer>
          {isLoading ? (
            <StyledLoading>Loading files...</StyledLoading>
          ) : files.length === 0 ? (
            <StyledEmpty>No files found</StyledEmpty>
          ) : (
            <S3FileGrid
              files={files}
              selectedFiles={selectedFiles}
              onSelectFile={handleSelectFile}
              onDoubleClick={handleFileDoubleClick}
              onDelete={handleDeleteFile}
              allowMultiple={allowMultiple}
            />
          )}
        </StyledFileGridContainer>

        {/* Footer Actions */}
        <StyledFooter>
          <StyledButtonSecondary onClick={onClose}>Cancel</StyledButtonSecondary>
          {selectedFiles.size > 0 && (
            <StyledButtonPrimary onClick={handleInsertSelected} disabled={isUploading || isLoading}>
              Insert ({selectedFiles.size})
            </StyledButtonPrimary>
          )}
        </StyledFooter>
      </StyledContainer>

      {/* Backdrop */}
      <StyledBackdrop onClick={onClose} />
    </StyledWidget>
  );
}

export default S3Widget;
