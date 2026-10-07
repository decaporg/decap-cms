import type { CmsMediaLibrary, CmsMediaProcessing } from '@/lib/util/types/cms/media.js';
import type { CmsFieldImage } from './image.js';

export interface CmsFieldFile {
  widget: 'file';
  default?: string;

  media_library?: CmsMediaLibrary;
  /** Overrides the global `media_processing` for uploads through this field. */
  media_processing?: CmsMediaProcessing;
  allow_multiple?: boolean;
  private?: boolean;
  config?: unknown;
  choose_url?: boolean;
}

export type CmsFieldFileOrImage = CmsFieldFile | CmsFieldImage;
