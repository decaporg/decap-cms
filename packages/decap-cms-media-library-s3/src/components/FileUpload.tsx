/**
 * File Upload Component
 * Handles file uploads with drag-and-drop support
 */

import { useRef, useState } from 'react';

import {
  StyledDropContent,
  StyledDropIcon,
  StyledDropSubtext,
  StyledDropText,
  StyledDropZone,
  StyledFileUploadContainer,
  StyledHiddenInput,
  StyledProgressBarContainer,
  StyledProgressBarFill,
  StyledUploadingContent,
  StyledUploadingText,
} from './styles';

import type React from 'react';


interface FileUploadProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress: number;
  currentPath: string;
  maxFileSizeLabel?: string;
}

export function FileUpload({
  onUpload,
  isUploading,
  uploadProgress,
  currentPath,
  maxFileSizeLabel,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0 && !isUploading) {
      onUpload(droppedFiles);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClick() {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <StyledFileUploadContainer>
      <StyledDropZone
        isDragging={isDragging}
        isUploading={isUploading}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <StyledHiddenInput
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <StyledUploadingContent>
            <StyledProgressBarContainer>
              <StyledProgressBarFill progress={uploadProgress} />
            </StyledProgressBarContainer>
            <StyledUploadingText>Uploading... {uploadProgress}%</StyledUploadingText>
          </StyledUploadingContent>
        ) : (
          <StyledDropContent>
            <StyledDropIcon>📤</StyledDropIcon>
            <StyledDropText>Drag files here or click to upload</StyledDropText>
            <StyledDropSubtext>
              Uploading to: {currentPath}
              {maxFileSizeLabel ? ` (max ${maxFileSizeLabel} per file)` : ''}
            </StyledDropSubtext>
          </StyledDropContent>
        )}
      </StyledDropZone>
    </StyledFileUploadContainer>
  );
}

export default FileUpload;
