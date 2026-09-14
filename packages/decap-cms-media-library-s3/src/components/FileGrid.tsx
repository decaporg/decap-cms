/**
 * File Grid Component
 * Displays files and directories in a grid layout
 */

import React, { useMemo } from 'react';

import {
  StyledCheckboxContainer,
  StyledCheckboxInput,
  StyledDeleteButton,
  StyledFileDate,
  StyledFileGrid,
  StyledFileGridItemContainer,
  StyledFileIcon,
  StyledFileInfo,
  StyledFileName,
  StyledFileSize,
  StyledThumbnail,
  StyledThumbnailImage,
} from './styles';

import type { AddressedMediaFile } from '../types';

interface FileGridProps {
  files: AddressedMediaFile[];
  selectedFiles: Set<string>;
  onSelectFile: (fileUrl: string) => void;
  onDoubleClick: (file: AddressedMediaFile) => void;
  onDelete: (key: string) => void;
  allowMultiple?: boolean;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'];

export function FileGrid({
  files,
  selectedFiles,
  onSelectFile,
  onDoubleClick,
  onDelete,
  allowMultiple,
}: FileGridProps) {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  function isImageFile(filename: string): boolean {
    const ext = getFileExtension(filename);
    return IMAGE_EXTENSIONS.includes(ext);
  }

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (a.IsDirectory !== b.IsDirectory) {
        return a.IsDirectory ? -1 : 1;
      }
      return a.ObjectName.localeCompare(b.ObjectName);
    });
  }, [files]);

  return (
    <StyledFileGrid>
      {sortedFiles.map(file => {
        const isSelected = selectedFiles.has(file.publicUrl);
        const isImage = !file.IsDirectory && isImageFile(file.ObjectName);
        const isHovered = hoveredItem === file.Key;

        return (
          <StyledFileGridItemContainer
            key={file.Key}
            isSelected={isSelected}
            isHovered={isHovered}
            onDoubleClick={() => onDoubleClick(file)}
            onClick={() => {
              if (!file.IsDirectory) {
                onSelectFile(file.publicUrl);
              }
            }}
            onMouseEnter={() => setHoveredItem(file.Key)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <StyledThumbnail>
              {file.IsDirectory ? (
                <StyledFileIcon>📁</StyledFileIcon>
              ) : isImage ? (
                <StyledThumbnailImage src={file.publicUrl} alt={file.ObjectName} loading="lazy" />
              ) : (
                <StyledFileIcon>📄</StyledFileIcon>
              )}

              {!file.IsDirectory && (
                <StyledCheckboxContainer visible={isHovered || isSelected}>
                  <StyledCheckboxInput
                    type={allowMultiple ? 'checkbox' : 'radio'}
                    checked={isSelected}
                    onChange={() => onSelectFile(file.publicUrl)}
                    onClick={e => e.stopPropagation()}
                  />
                </StyledCheckboxContainer>
              )}

              {!file.IsDirectory && (
                <StyledDeleteButton
                  visible={isHovered}
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(file.Key);
                  }}
                  title="Delete file"
                >
                  🗑️
                </StyledDeleteButton>
              )}
            </StyledThumbnail>

            <StyledFileName title={file.ObjectName}>{file.ObjectName}</StyledFileName>

            <StyledFileInfo>
              {!file.IsDirectory && <StyledFileSize>{formatFileSize(file.Size)}</StyledFileSize>}
              <StyledFileDate>{formatDate(file.LastModified)}</StyledFileDate>
            </StyledFileInfo>
          </StyledFileGridItemContainer>
        );
      })}
    </StyledFileGrid>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return '';
  }
}

export default FileGrid;
