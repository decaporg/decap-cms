import { basename, fileExtension, fileExtensionWithSeparator } from 'decap-cms-lib-util';

import type { CmsMediaProcessing, EntryField } from '../types/redux';

export type MediaProcessingConfig = {
  format?: 'jpeg' | 'webp';
  quality?: number;
  stripMetadata?: boolean;
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
};

export type ImageTransformationFile = {
  file: File;
  path: string;
};

type PlainFieldMediaProcessing = {
  media_processing?: CmsMediaProcessing;
};

type FieldMediaProcessingGetter = {
  get: (key: 'media_processing') => CmsMediaProcessing | undefined;
};

const SUPPORTED_INPUT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function hasMediaProcessingGetter(
  field: EntryField | PlainFieldMediaProcessing | undefined,
): field is EntryField & FieldMediaProcessingGetter {
  return typeof (field as FieldMediaProcessingGetter | undefined)?.get === 'function';
}

function getFieldMediaProcessing(field?: EntryField | PlainFieldMediaProcessing) {
  const mediaProcessing = (
    hasMediaProcessingGetter(field)
      ? field.get('media_processing')
      : (field as PlainFieldMediaProcessing | undefined)?.media_processing
  ) as (CmsMediaProcessing & { toJS?: () => CmsMediaProcessing }) | undefined;

  return mediaProcessing?.toJS ? mediaProcessing.toJS() : mediaProcessing;
}

function normalizeFormat(format: string | undefined) {
  const normalized = (format || '').toLowerCase();
  return normalized === 'jpg' ? 'jpeg' : normalized;
}

function parseAspectRatio(aspectRatio: CmsMediaProcessing['aspect_ratio']) {
  if (typeof aspectRatio === 'number') {
    return aspectRatio > 0 ? aspectRatio : null;
  }

  if (typeof aspectRatio !== 'string') {
    return null;
  }

  const match = aspectRatio.match(/^(\d+(?:\.\d+)?)[_:x](\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? width / height : null;
}

export function getMediaProcessingConfig(
  config: { media_processing?: CmsMediaProcessing },
  field?: EntryField,
): MediaProcessingConfig | undefined {
  const mediaProcessing = getFieldMediaProcessing(field) ?? config.media_processing;

  if (!mediaProcessing?.enabled) {
    return undefined;
  }

  return {
    format: mediaProcessing.format?.enabled
      ? (normalizeFormat(mediaProcessing.format.default) as MediaProcessingConfig['format'])
      : undefined,
    quality: mediaProcessing.quality ? mediaProcessing.quality / 100 : undefined,
    stripMetadata: mediaProcessing.strip_metadata ?? false,
    width: mediaProcessing.width ?? null,
    height: mediaProcessing.height ?? null,
    aspectRatio: parseAspectRatio(mediaProcessing.aspect_ratio),
  };
}

export function shouldTransformImage(file: File, config: MediaProcessingConfig | undefined) {
  if (!config || !SUPPORTED_INPUT_TYPES.has(file.type.toLowerCase())) {
    return false;
  }

  return !!(
    config.format ||
    config.quality ||
    config.stripMetadata ||
    config.width ||
    config.height ||
    config.aspectRatio
  );
}

function getMimeType(format: string) {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    default:
      return 'image/jpeg';
  }
}

function getInputFormat(fileName: string) {
  const inputFormat = fileExtension(fileName).toLowerCase();
  return normalizeFormat(inputFormat);
}

function getOutputFormat(fileName: string, config: MediaProcessingConfig) {
  if (config.format) {
    return config.format;
  }

  const inputFormat = getInputFormat(fileName);
  if (inputFormat === 'jpeg' || inputFormat === 'png' || inputFormat === 'webp') {
    return inputFormat;
  }

  return 'jpeg';
}

function getOutputExtension(format: string) {
  return format === 'jpeg' ? 'jpg' : format;
}

export function getMediaProcessingFileName(fileName: string, config?: MediaProcessingConfig) {
  if (!config) {
    return fileName;
  }

  if (!config.format) {
    return fileName;
  }

  const extension = fileExtensionWithSeparator(fileName);
  const baseName = extension ? basename(fileName, extension) : basename(fileName);
  return `${baseName}.${getOutputExtension(config.format)}`;
}

function getProcessedPath(originalPath: string, fileName: string) {
  const originalName = basename(originalPath);
  const parent = originalPath.slice(0, Math.max(0, originalPath.length - originalName.length));

  return `${parent}${fileName}`;
}

function getTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  config: MediaProcessingConfig,
) {
  const width = config.width ?? undefined;
  const height = config.height ?? undefined;
  const aspectRatio = config.aspectRatio ?? sourceWidth / sourceHeight;

  if (width && height) {
    return { width, height };
  }

  if (width) {
    return { width, height: Math.round(width / aspectRatio) };
  }

  if (height) {
    return { width: Math.round(height * aspectRatio), height };
  }

  if (config.aspectRatio) {
    return { width: sourceWidth, height: Math.round(sourceWidth / aspectRatio) };
  }

  return { width: sourceWidth, height: sourceHeight };
}

function getSourceCrop(sourceWidth: number, sourceHeight: number, aspectRatio?: number | null) {
  if (!aspectRatio) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  const sourceRatio = sourceWidth / sourceHeight;
  if (sourceRatio > aspectRatio) {
    const width = Math.round(sourceHeight * aspectRatio);
    return { x: Math.round((sourceWidth - width) / 2), y: 0, width, height: sourceHeight };
  }

  const height = Math.round(sourceWidth / aspectRatio);
  return { x: 0, y: Math.round((sourceHeight - height) / 2), width: sourceWidth, height };
}

function loadImage(file: File) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image '${file.name}'`));
    };
    image.src = url;
  });
}

async function encodeImageData(imageData: ImageData, format: string, quality = 0.75) {
  if (format === 'webp') {
    const { encode } = await import('@jsquash/webp');
    return encode(imageData, { quality: Math.round(quality * 100) });
  }

  throw new Error(`ImageData encoding is not supported for '${format}'`);
}

function encodeCanvas(canvas: HTMLCanvasElement, format: string, quality = 0.75) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error(`Failed to encode image as '${format}'`));
          return;
        }

        resolve(blob);
      },
      getMimeType(format),
      quality,
    );
  });
}

export async function transformImage(
  file: File,
  originalPath: string,
  config: MediaProcessingConfig,
): Promise<ImageTransformationFile[]> {
  const originalFileName = basename(originalPath);
  const outputFormat = getOutputFormat(originalFileName, config);
  const mimeType = getMimeType(outputFormat);
  const image = await loadImage(file);
  const crop = getSourceCrop(image.width, image.height, config.aspectRatio);
  const { width, height } = getTargetDimensions(crop.width, crop.height, config);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);

  if ('close' in image && typeof image.close === 'function') {
    image.close();
  }

  const encoded =
    outputFormat === 'webp'
      ? await encodeImageData(
          context.getImageData(0, 0, width, height),
          outputFormat,
          config.quality,
        )
      : await encodeCanvas(canvas, outputFormat, config.quality);
  const fileName = getMediaProcessingFileName(originalFileName, config);
  const transformedFile = new File([encoded], fileName, { type: mimeType });

  return [{ file: transformedFile, path: getProcessedPath(originalPath, fileName) }];
}
