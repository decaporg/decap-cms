import { fromJS } from 'immutable';

import {
  getMediaProcessingConfig,
  getMediaProcessingFileName,
  shouldTransformImage,
  transformImage,
} from '../imageTransformations';

const mockEncodeWebp = jest.fn(() => Promise.resolve(new ArrayBuffer(3)));
const mockCloseImage = jest.fn();
const mockDrawImage = jest.fn();
const mockImageData = { width: 160, height: 90, data: new Uint8ClampedArray(160 * 90 * 4) };
const mockGetImageData = jest.fn(() => mockImageData);
const mockToBlob = jest.fn(callback => callback(new Blob(['encoded'], { type: 'image/jpeg' })));

jest.mock('@jsquash/webp', () => ({ encode: mockEncodeWebp }), { virtual: true });

describe('imageTransformations', () => {
  const originalCreateImageBitmap = global.createImageBitmap;
  const originalCreateElement = document.createElement;

  beforeEach(() => {
    jest.clearAllMocks();
    global.createImageBitmap = jest.fn(() =>
      Promise.resolve({
        width: 400,
        height: 300,
        close: mockCloseImage,
      } as unknown as ImageBitmap),
    );
    document.createElement = jest.fn(() => ({
      width: 0,
      height: 0,
      getContext: jest.fn(() => ({
        drawImage: mockDrawImage,
        getImageData: mockGetImageData,
      })),
      toBlob: mockToBlob,
    })) as unknown as typeof document.createElement;
  });

  afterEach(() => {
    global.createImageBitmap = originalCreateImageBitmap;
    document.createElement = originalCreateElement;
  });

  describe('getMediaProcessingConfig', () => {
    it('returns undefined when media processing is disabled', () => {
      expect(getMediaProcessingConfig({ media_processing: { enabled: false } })).toBeUndefined();
      expect(getMediaProcessingConfig({})).toBeUndefined();
    });

    it('normalizes root media processing config', () => {
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

    it('uses field config over root config', () => {
      const field = fromJS({
        media_processing: {
          enabled: true,
          format: { enabled: true, default: 'webp' },
        },
      });

      expect(
        getMediaProcessingConfig(
          {
            media_processing: {
              enabled: true,
              format: { enabled: true, default: 'jpeg' },
            },
          },
          field,
        ),
      ).toEqual({
        format: 'webp',
        quality: undefined,
        stripMetadata: false,
        width: null,
        height: null,
        aspectRatio: null,
      });
    });

    it('supports plain object field config from media upload options', () => {
      const field = {
        media_processing: {
          enabled: true,
          format: { enabled: false, default: 'webp' },
        },
      };

      expect(getMediaProcessingConfig({}, field)).toEqual({
        format: undefined,
        quality: undefined,
        stripMetadata: false,
        width: null,
        height: null,
        aspectRatio: null,
      });
    });
  });

  describe('shouldTransformImage', () => {
    it('requires config and a supported image format', () => {
      const config = { format: 'jpeg' as const, width: null, height: null, aspectRatio: null };

      expect(shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), config)).toBe(
        true,
      );
      expect(shouldTransformImage(new File([], 'image.png', { type: 'image/png' }), config)).toBe(
        true,
      );
      expect(shouldTransformImage(new File([], 'image.webp', { type: 'image/webp' }), config)).toBe(
        true,
      );
      expect(
        shouldTransformImage(new File([], 'image.svg', { type: 'image/svg+xml' }), config),
      ).toBe(false);
      expect(shouldTransformImage(new File([], 'image.gif', { type: 'image/gif' }), config)).toBe(
        false,
      );
      expect(shouldTransformImage(new File([], 'image.avif', { type: 'image/avif' }), config)).toBe(
        false,
      );
      expect(
        shouldTransformImage(new File([], 'file.pdf', { type: 'application/pdf' }), config),
      ).toBe(false);
      expect(
        shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), undefined),
      ).toBe(false);
    });

    it('requires at least one processing operation', () => {
      const noProcessing = {
        format: undefined,
        quality: undefined,
        stripMetadata: false,
        width: null,
        height: null,
        aspectRatio: null,
      };

      expect(
        shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), noProcessing),
      ).toBe(false);
      expect(
        shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), {
          ...noProcessing,
          stripMetadata: true,
        }),
      ).toBe(true);
      expect(
        shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), {
          ...noProcessing,
          quality: 0.8,
        }),
      ).toBe(true);
      expect(
        shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), {
          ...noProcessing,
          width: 400,
        }),
      ).toBe(true);
    });
  });

  describe('getMediaProcessingFileName', () => {
    it('uses the configured output extension', () => {
      expect(
        getMediaProcessingFileName('kittens.jpeg', {
          format: 'webp',
          width: null,
          height: null,
          aspectRatio: null,
        }),
      ).toBe('kittens.webp');
      expect(
        getMediaProcessingFileName('kittens.png', {
          format: 'jpeg',
          width: null,
          height: null,
          aspectRatio: null,
        }),
      ).toBe('kittens.jpg');
    });

    it('preserves the original file name when format conversion is disabled', () => {
      expect(
        getMediaProcessingFileName('kittens.png', {
          format: undefined,
          width: null,
          height: null,
          aspectRatio: null,
        }),
      ).toBe('kittens.png');
    });
  });

  describe('transformImage', () => {
    it('encodes webp with jSquash and strips metadata by re-encoding', async () => {
      const file = new File(['original'], 'Kitten Photo.JPG', { type: 'image/jpeg' });
      const files = await transformImage(file, 'static/media/kitten-photo.jpg', {
        format: 'webp',
        quality: 0.8,
        width: 160,
        height: null,
        aspectRatio: 16 / 9,
      });

      expect(files).toHaveLength(1);
      expect(files[0].file.name).toBe('kitten-photo.webp');
      expect(files[0].file.type).toBe('image/webp');
      expect(files[0].path).toBe('static/media/kitten-photo.webp');
      expect(mockDrawImage).toHaveBeenCalledWith(
        expect.any(Object),
        0,
        38,
        400,
        225,
        0,
        0,
        160,
        90,
      );
      expect(mockGetImageData).toHaveBeenCalledWith(0, 0, 160, 90);
      expect(mockEncodeWebp).toHaveBeenCalledWith(mockImageData, { quality: 80 });
      expect(mockCloseImage).toHaveBeenCalledTimes(1);
    });

    it('encodes jpeg with canvas', async () => {
      const file = new File(['original'], 'kittens.png', { type: 'image/png' });
      const files = await transformImage(file, 'static/media/kittens.png', {
        format: 'jpeg',
        quality: 0.7,
        width: null,
        height: null,
        aspectRatio: null,
      });

      expect(files[0].file.name).toBe('kittens.jpg');
      expect(files[0].file.type).toBe('image/jpeg');
      expect(files[0].path).toBe('static/media/kittens.jpg');
      expect(mockToBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.7);
      expect(mockEncodeWebp).not.toHaveBeenCalled();
    });
  });
});
