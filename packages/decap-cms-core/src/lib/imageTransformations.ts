import { join } from 'path';
import { basename, fileExtension, fileExtensionWithSeparator } from 'decap-cms-lib-util';

import type * as Photon from '@silvia-odwyer/photon';
import type { CmsImageTransformations, EntryField } from '../types/redux';

type PhotonImage = InstanceType<typeof Photon.PhotonImage>;

export type ImageTransformationConfig = {
  keepOriginal: boolean;
  variants: ImageTransformationVariant[];
};

type ImageTransformationVariant = {
  name: string;
  width?: number;
  height?: number;
  format?: string;
  quality?: number;
  default?: boolean;
  keep_original_size?: boolean;
};

export type ImageTransformationFile = {
  file: File;
  path: string;
  default?: boolean;
  original?: boolean;
};

const TRANSFORMATIONS_FOLDER = '_transformations';
const SUPPORTED_OUTPUT_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

function getFieldImageTransformations(field?: EntryField) {
  const imageTransformations = field?.get('image_transformations') as
    | (CmsImageTransformations & { toJS?: () => CmsImageTransformations })
    | undefined;

  return imageTransformations?.toJS ? imageTransformations.toJS() : imageTransformations;
}

function normalizeVariant(variant: ImageTransformationVariant) {
  const format = variant.format?.toLowerCase();
  return {
    ...variant,
    format: format === 'jpeg' ? 'jpg' : format,
  };
}

export function getImageTransformationsConfig(
  config: { image_transformations?: CmsImageTransformations },
  field?: EntryField,
): ImageTransformationConfig | undefined {
  const imageTransformations = getFieldImageTransformations(field) ?? config.image_transformations;

  if (!imageTransformations) {
    return undefined;
  }

  if (Array.isArray(imageTransformations)) {
    return {
      keepOriginal: true,
      variants: imageTransformations.map(normalizeVariant),
    };
  }

  return {
    keepOriginal: imageTransformations.keep_original ?? true,
    variants: (imageTransformations.variants || []).map(normalizeVariant),
  };
}

export function shouldTransformImage(file: File, config: ImageTransformationConfig | undefined) {
  return (
    !!config &&
    config.variants.length > 0 &&
    file.type.startsWith('image/') &&
    file.type !== 'image/svg+xml'
  );
}

function getOutputFormat(fileName: string, variant: ImageTransformationVariant) {
  const inputFormat = fileExtension(fileName).toLowerCase();
  const outputFormat = variant.format || inputFormat;

  return SUPPORTED_OUTPUT_FORMATS.includes(outputFormat) ? outputFormat : 'png';
}

function getMimeType(format: string) {
  switch (format) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/png';
  }
}

function getVariantFileName(fileName: string, format: string) {
  const extension = fileExtensionWithSeparator(fileName);
  const baseName = extension ? basename(fileName, extension) : basename(fileName);
  return `${baseName}.${format === 'jpeg' ? 'jpg' : format}`;
}

function getVariantPath(originalPath: string, variantName: string, variantFileName: string) {
  const originalName = basename(originalPath);
  const parent = originalPath.slice(0, Math.max(0, originalPath.length - originalName.length));

  return join(parent, TRANSFORMATIONS_FOLDER, variantName, variantFileName);
}

function getResizeDimensions(
  image: { get_width: () => number; get_height: () => number },
  variant: ImageTransformationVariant,
) {
  const originalWidth = image.get_width();
  const originalHeight = image.get_height();

  if (variant.keep_original_size || (!variant.width && !variant.height)) {
    return { width: originalWidth, height: originalHeight };
  }

  if (variant.width && variant.height) {
    const scale = Math.min(variant.width / originalWidth, variant.height / originalHeight);
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
    };
  }

  if (variant.width) {
    return {
      width: variant.width,
      height: Math.round((originalHeight * variant.width) / originalWidth),
    };
  }

  const height = variant.height as number;
  return {
    width: Math.round((originalWidth * height) / originalHeight),
    height,
  };
}

function getImageBytes(image: PhotonImage, format: string, quality = 75) {
  if (format === 'jpg' || format === 'jpeg') {
    return image.get_bytes_jpeg(quality);
  }

  if (format === 'webp') {
    return image.get_bytes_webp();
  }

  return image.get_bytes();
}

export async function transformImage(
  file: File,
  originalPath: string,
  config: ImageTransformationConfig,
): Promise<ImageTransformationFile[]> {
  const photon = await import('@silvia-odwyer/photon');
  const initPhoton = (photon as unknown as { default: () => Promise<unknown> }).default;
  await initPhoton();

  const originalImage = photon.PhotonImage.new_from_blob(file);

  try {
    const transformedFiles = config.variants.map(variant => {
      const { width, height } = getResizeDimensions(originalImage, variant);
      const resizedImage =
        width === originalImage.get_width() && height === originalImage.get_height()
          ? originalImage
          : photon.resize(originalImage, width, height, photon.SamplingFilter.Lanczos3);
      const format = getOutputFormat(file.name, variant);
      const variantFileName = getVariantFileName(file.name, format);
      const bytes = getImageBytes(resizedImage, format, variant.quality);
      const transformedFile = new File([bytes], variantFileName, { type: getMimeType(format) });

      if (resizedImage !== originalImage) {
        resizedImage.free();
      }

      return {
        file: transformedFile,
        path: getVariantPath(originalPath, variant.name, variantFileName),
        default: variant.default,
      };
    });

    return config.keepOriginal
      ? [{ file, path: originalPath, original: true }, ...transformedFiles]
      : transformedFiles;
  } finally {
    originalImage.free();
  }
}

export function sortTransformationFilesForSelection(files: ImageTransformationFile[]) {
  const defaultIndex = files.findIndex(file => file.default);
  const originalIndex = files.findIndex(file => file.original);
  const selectedIndex = defaultIndex >= 0 ? defaultIndex : originalIndex;

  if (selectedIndex < 0) {
    return files;
  }

  const selectedFile = files[selectedIndex];
  return [...files.slice(0, selectedIndex), ...files.slice(selectedIndex + 1), selectedFile];
}
