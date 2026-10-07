import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getMediaProcessingConfig,
  getMediaProcessingFileName,
  shouldTransformImage,
  transformImageFile,
} from '@/lib/util/mediaProcessing';

import type { MediaProcessingConfig } from '@/lib/util/mediaProcessing';

const mocks = vi.hoisted(() => ({
  encodeWebp: vi.fn(() => Promise.resolve(new ArrayBuffer(3))),
  closeImage: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  toBlob: vi.fn((callback: (blob: Blob) => void) => callback(new Blob(['encoded'], { type: 'image/jpeg' }))),
}));

vi.mock('@jsquash/webp/encode.js', () => ({ default: mocks.encodeWebp, init: vi.fn() }));

const imageData = { width: 160, height: 90, data: new Uint8ClampedArray(160 * 90 * 4) };

const noProcessing: MediaProcessingConfig = {
  format: undefined,
  quality: undefined,
  stripMetadata: false,
  width: null,
  height: null,
  aspectRatio: null,
};

describe('mediaProcessing (decaporg #7845)', () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getImageData.mockReturnValue(imageData);
    globalThis.createImageBitmap = vi.fn(() =>
      Promise.resolve({ width: 400, height: 300, close: mocks.closeImage } as unknown as ImageBitmap)
    );
    vi.spyOn(document, 'createElement').mockImplementation(
      ((tag: string) =>
        tag === 'canvas'
          ? {
            width: 0,
            height: 0,
            getContext: () => ({ drawImage: mocks.drawImage, getImageData: mocks.getImageData }),
            toBlob: mocks.toBlob,
          }
          : originalCreateElement(tag)) as typeof document.createElement,
    );
  });

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    vi.restoreAllMocks();
  });

  describe('getMediaProcessingConfig', () => {
    it('is undefined when processing is disabled or absent', () => {
      expect(getMediaProcessingConfig({ media_processing: { enabled: false } })).toBeUndefined();
      expect(getMediaProcessingConfig({})).toBeUndefined();
    });

    it('normalizes the global config', () => {
      expect(
        getMediaProcessingConfig({
          media_processing: {
            enabled: true,
            format: { enabled: true, default: 'jpeg' },
            quality: 90,
            strip_metadata: true,
            width: 1600,
            height: null,
            aspect_ratio: '16_9',
          },
        }),
      ).toEqual({
        format: 'jpeg',
        quality: 0.9,
        stripMetadata: true,
        width: 1600,
        height: null,
        aspectRatio: 16 / 9,
      });
    });

    it('accepts x- and colon-delimited aspect ratios and plain numbers', () => {
      for (const aspect_ratio of ['16x9', '16:9', 16 / 9]) {
        expect(getMediaProcessingConfig({ media_processing: { enabled: true, aspect_ratio } })).toMatchObject({
          aspectRatio: 16 / 9,
        });
      }
    });

    it('prefers the field config over the global config', () => {
      expect(
        getMediaProcessingConfig(
          { media_processing: { enabled: true, format: { enabled: true, default: 'jpeg' } } },
          { media_processing: { enabled: true, format: { enabled: true, default: 'webp' } } },
        ),
      ).toEqual({ ...noProcessing, format: 'webp' });
    });

    it('keeps the original format when format conversion is disabled', () => {
      expect(
        getMediaProcessingConfig({}, {
          media_processing: { enabled: true, format: { enabled: false, default: 'webp' } },
        }),
      ).toEqual(noProcessing);
    });
  });

  describe('shouldTransformImage', () => {
    it('needs a config and a JPEG, PNG or WebP image', () => {
      const config = { ...noProcessing, format: 'jpeg' as const };
      const file = (name: string, type: string) => new File([], name, { type });

      expect(shouldTransformImage(file('image.jpg', 'image/jpeg'), config)).toBe(true);
      expect(shouldTransformImage(file('image.png', 'image/png'), config)).toBe(true);
      expect(shouldTransformImage(file('image.webp', 'image/webp'), config)).toBe(true);
      expect(shouldTransformImage(file('image.svg', 'image/svg+xml'), config)).toBe(false);
      expect(shouldTransformImage(file('image.gif', 'image/gif'), config)).toBe(false);
      expect(shouldTransformImage(file('file.pdf', 'application/pdf'), config)).toBe(false);
      expect(shouldTransformImage(file('image.jpg', 'image/jpeg'), undefined)).toBe(false);
    });

    it('needs at least one processing operation', () => {
      const jpeg = new File([], 'image.jpg', { type: 'image/jpeg' });

      expect(shouldTransformImage(jpeg, noProcessing)).toBe(false);
      expect(shouldTransformImage(jpeg, { ...noProcessing, stripMetadata: true })).toBe(true);
      expect(shouldTransformImage(jpeg, { ...noProcessing, quality: 0.8 })).toBe(true);
      expect(shouldTransformImage(jpeg, { ...noProcessing, width: 400 })).toBe(true);
    });
  });

  describe('getMediaProcessingFileName', () => {
    it('switches the extension to the output format', () => {
      expect(getMediaProcessingFileName('kittens.jpeg', { ...noProcessing, format: 'webp' })).toBe('kittens.webp');
      expect(getMediaProcessingFileName('kittens.png', { ...noProcessing, format: 'jpeg' })).toBe('kittens.jpg');
    });

    it('keeps the name when the format is not converted', () => {
      expect(getMediaProcessingFileName('kittens.png', noProcessing)).toBe('kittens.png');
    });
  });

  describe('transformImageFile', () => {
    it('crops, resizes and encodes WebP with the WASM encoder', async () => {
      const file = new File(['original'], 'kitten-photo.jpg', { type: 'image/jpeg' });
      const result = await transformImageFile(file, {
        ...noProcessing,
        format: 'webp',
        quality: 0.8,
        width: 160,
        aspectRatio: 16 / 9,
      });

      expect(result.name).toBe('kitten-photo.webp');
      expect(result.type).toBe('image/webp');
      // 400x300 centre-cropped to 16:9 (400x225 at y=38), then scaled to 160x90.
      expect(mocks.drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 38, 400, 225, 0, 0, 160, 90);
      expect(mocks.getImageData).toHaveBeenCalledWith(0, 0, 160, 90);
      expect(mocks.encodeWebp).toHaveBeenCalledWith(imageData, { quality: 80 });
      expect(mocks.closeImage).toHaveBeenCalledTimes(1);
    });

    it('encodes JPEG with the canvas encoder', async () => {
      const file = new File(['original'], 'kittens.png', { type: 'image/png' });
      const result = await transformImageFile(file, { ...noProcessing, format: 'jpeg', quality: 0.7 });

      expect(result.name).toBe('kittens.jpg');
      expect(result.type).toBe('image/jpeg');
      expect(mocks.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.7);
      expect(mocks.encodeWebp).not.toHaveBeenCalled();
    });

    it('keeps a PNG a PNG when only resizing', async () => {
      const file = new File(['original'], 'diagram.png', { type: 'image/png' });
      const result = await transformImageFile(file, { ...noProcessing, width: 200 });

      expect(result.name).toBe('diagram.png');
      expect(result.type).toBe('image/png');
      expect(mocks.drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 0, 400, 300, 0, 0, 200, 150);
    });
  });
});
