import { basename, fileExtension, fileExtensionWithSeparator } from '@/lib/util/core-utils/path';

import type { CmsMediaProcessing } from '@/lib/util/types/cms/media.js';

/**
 * Browser-side processing of uploaded images (`media_processing`, decaporg
 * #7845): resize, centre-crop to an aspect ratio, strip metadata by
 * re-encoding, and optionally convert to JPEG or WebP. One processed file
 * replaces the upload before it is stored.
 *
 * JPEG goes through the canvas encoder. WebP uses `@jsquash/webp` (a WASM
 * encoder) because Safari's canvas can't encode WebP; it is imported lazily,
 * so its code and `.wasm` files load only when an upload is converted to
 * WebP.
 */
export type MediaProcessingConfig = {
  format?: 'jpeg' | 'webp' | undefined,
  /** 0-1 */
  quality?: number | undefined,
  stripMetadata: boolean,
  width: number | null,
  height: number | null,
  aspectRatio: number | null,
};

/** JSON Schema for a `media_processing` block (global or on an image/file field). */
export const mediaProcessingSchema = {
  type: 'object',
  properties: {
    enabled: { type: 'boolean' },
    format: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        default: { type: 'string', enum: ['jpeg', 'webp'] },
      },
      required: ['enabled', 'default'],
      additionalProperties: false,
    },
    quality: { type: 'number', minimum: 1, maximum: 100 },
    strip_metadata: { type: 'boolean' },
    width: { oneOf: [{ type: 'number', minimum: 1 }, { type: 'null' }] },
    height: { oneOf: [{ type: 'number', minimum: 1 }, { type: 'null' }] },
    aspect_ratio: {
      oneOf: [
        { type: 'number', exclusiveMinimum: 0 },
        { type: 'string', pattern: '^\\d+(?:\\.\\d+)?[_:x]\\d+(?:\\.\\d+)?$' },
        { type: 'null' },
      ],
    },
  },
  required: ['enabled'],
  additionalProperties: false,
};

const SUPPORTED_INPUT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

/**
 * The effective processing config for an upload: the field's own
 * `media_processing` wins over the global one. `undefined` when processing
 * is off.
 */
export function getMediaProcessingConfig(
  config: { media_processing?: CmsMediaProcessing | undefined },
  field?: { media_processing?: CmsMediaProcessing | undefined } | undefined,
): MediaProcessingConfig | undefined {
  const mediaProcessing = field?.media_processing ?? config.media_processing;

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

/** Whether `file` is a supported image and `config` asks for any processing. */
export function shouldTransformImage(file: File, config: MediaProcessingConfig | undefined) {
  if (!config || !SUPPORTED_INPUT_TYPES.has(file.type.toLowerCase())) {
    return false;
  }

  return !!(
    config.format
    || config.quality
    || config.stripMetadata
    || config.width
    || config.height
    || config.aspectRatio
  );
}

function getMimeType(format: string) {
  switch (format) {
    case 'webp':
      return 'image/webp';
    case 'png':
      return 'image/png';
    default:
      return 'image/jpeg';
  }
}

function getOutputFormat(fileName: string, config: MediaProcessingConfig) {
  if (config.format) {
    return config.format;
  }
  const inputFormat = normalizeFormat(fileExtension(fileName));
  return inputFormat === 'jpeg' || inputFormat === 'png' || inputFormat === 'webp' ? inputFormat : 'jpeg';
}

/**
 * The stored name of a processed upload: unchanged unless the format is
 * converted, in which case the extension follows the new format.
 */
export function getMediaProcessingFileName(fileName: string, config?: MediaProcessingConfig) {
  if (!config?.format) {
    return fileName;
  }
  const extension = fileExtensionWithSeparator(fileName);
  const baseName = extension ? basename(fileName, extension) : basename(fileName);
  return `${baseName}.${config.format === 'jpeg' ? 'jpg' : config.format}`;
}

function getTargetDimensions(sourceWidth: number, sourceHeight: number, config: MediaProcessingConfig) {
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

function getSourceCrop(sourceWidth: number, sourceHeight: number, aspectRatio: number | null) {
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

function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
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

/**
 * Set by the script-tag builds (CDN and demo), which ship the encoder's
 * `.wasm` files beside the bundle; see `vite.webp-wasm.ts`. Undefined in the
 * npm build, where the consumer's bundler resolves them.
 */
declare const __DECAP_WEBP_WASM_BESIDE_BUNDLE__: boolean | undefined;

/**
 * Where the bundle itself was loaded from, captured while it evaluates:
 * `document.currentScript` for a classic `<script>` (UMD/IIFE), otherwise the
 * ES module's own URL.
 */
const bundleUrl = typeof document !== 'undefined' && document.currentScript instanceof HTMLScriptElement
  ? document.currentScript.src
  : (import.meta as { url?: string }).url;

let webpEncoderReady: Promise<unknown> | undefined;

async function encodeWebp(imageData: ImageData, quality = 0.75) {
  const { default: encode, init } = await import('@jsquash/webp/encode.js');
  if (typeof __DECAP_WEBP_WASM_BESIDE_BUNDLE__ !== 'undefined' && __DECAP_WEBP_WASM_BESIDE_BUNDLE__ && bundleUrl) {
    webpEncoderReady ??= init({ locateFile: (file: string) => new URL(file, bundleUrl).href });
    await webpEncoderReady;
  }
  return encode(imageData, { quality: Math.round(quality * 100) });
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

/** Process an uploaded image per `config` and return the replacement file. */
export async function transformImageFile(file: File, config: MediaProcessingConfig): Promise<File> {
  const outputFormat = getOutputFormat(file.name, config);
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

  const encoded = outputFormat === 'webp'
    ? await encodeWebp(context.getImageData(0, 0, width, height), config.quality)
    : await encodeCanvas(canvas, outputFormat, config.quality);

  return new File([encoded], getMediaProcessingFileName(file.name, config), {
    type: getMimeType(outputFormat),
  });
}
