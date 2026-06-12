import { fromJS } from 'immutable';

import {
  getImageTransformationsConfig,
  shouldTransformImage,
  sortTransformationFilesForSelection,
  transformImage,
} from '../imageTransformations';

const mockPhotonImage = {
  get_width: jest.fn(() => 100),
  get_height: jest.fn(() => 50),
  get_bytes_webp: jest.fn(() => new Uint8Array([1, 2, 3])),
  get_bytes_jpeg: jest.fn(() => new Uint8Array([4, 5, 6])),
  get_bytes: jest.fn(() => new Uint8Array([7, 8, 9])),
  free: jest.fn(),
};

const mockNewFromByteslice = jest.fn(() => mockPhotonImage);
const mockNewFromBlob = jest.fn();

jest.mock(
  '@silvia-odwyer/photon',
  () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve()),
    PhotonImage: {
      new_from_byteslice: mockNewFromByteslice,
      new_from_blob: mockNewFromBlob,
    },
    resize: jest.fn(),
    SamplingFilter: { Lanczos3: 'Lanczos3' },
  }),
  { virtual: true },
);

describe('imageTransformations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getImageTransformationsConfig', () => {
    it('normalizes array shorthand and keeps the original by default', () => {
      expect(
        getImageTransformationsConfig({
          image_transformations: [{ name: 'small', width: 100, format: 'jpeg' }],
        }),
      ).toEqual({
        keepOriginal: true,
        variants: [{ name: 'small', width: 100, format: 'jpg' }],
      });
    });

    it('normalizes object config with keep_original', () => {
      expect(
        getImageTransformationsConfig({
          image_transformations: {
            keep_original: false,
            variants: [{ name: 'compressed', quality: 70, keep_original_size: true }],
          },
        }),
      ).toEqual({
        keepOriginal: false,
        variants: [{ name: 'compressed', quality: 70, keep_original_size: true }],
      });
    });

    it('uses field config over root config', () => {
      const field = fromJS({
        image_transformations: [{ name: 'field', width: 200 }],
      });

      expect(
        getImageTransformationsConfig(
          {
            image_transformations: [{ name: 'root', width: 100 }],
          },
          field,
        ),
      ).toEqual({
        keepOriginal: true,
        variants: [{ name: 'field', width: 200 }],
      });
    });

    it('supports plain object field config from media upload options', () => {
      const field = {
        image_transformations: [{ name: 'field', width: 200 }],
      };

      expect(getImageTransformationsConfig({}, field)).toEqual({
        keepOriginal: true,
        variants: [{ name: 'field', width: 200 }],
      });
    });
  });

  describe('shouldTransformImage', () => {
    it('requires config, variants, and a non-svg image', () => {
      const config = { keepOriginal: true, variants: [{ name: 'small', width: 100 }] };

      expect(shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), config)).toBe(
        true,
      );
      expect(
        shouldTransformImage(new File([], 'image.svg', { type: 'image/svg+xml' }), config),
      ).toBe(false);
      expect(
        shouldTransformImage(new File([], 'file.pdf', { type: 'application/pdf' }), config),
      ).toBe(false);
      expect(
        shouldTransformImage(new File([], 'image.jpg', { type: 'image/jpeg' }), {
          keepOriginal: true,
          variants: [],
        }),
      ).toBe(false);
    });
  });

  describe('sortTransformationFilesForSelection', () => {
    it('moves the default variant to the end so the media library selects it', () => {
      const original = { file: new File([], 'image.jpg'), path: 'image.jpg', original: true };
      const small = { file: new File([], 'image.jpg'), path: 'small/image.jpg' };
      const medium = { file: new File([], 'image.jpg'), path: 'medium/image.jpg', default: true };

      expect(sortTransformationFilesForSelection([original, medium, small])).toEqual([
        original,
        small,
        medium,
      ]);
    });

    it('moves the original to the end when no default variant is configured', () => {
      const original = { file: new File([], 'image.jpg'), path: 'image.jpg', original: true };
      const small = { file: new File([], 'image.jpg'), path: 'small/image.jpg' };

      expect(sortTransformationFilesForSelection([original, small])).toEqual([small, original]);
    });
  });

  describe('transformImage', () => {
    it('creates the Photon image from file bytes instead of blob', async () => {
      const file = new File([new Uint8Array([255, 216, 255])], 'image.jpg', {
        type: 'image/jpeg',
      });

      const files = await transformImage(file, 'uploads/image.jpg', {
        keepOriginal: false,
        variants: [{ name: 'webp', format: 'webp', keep_original_size: true }],
      });

      expect(mockNewFromByteslice).toHaveBeenCalledTimes(1);
      expect(mockNewFromByteslice.mock.calls[0][0]).toEqual(new Uint8Array([255, 216, 255]));
      expect(mockNewFromBlob).not.toHaveBeenCalled();
      expect(files).toHaveLength(1);
      expect(files[0].file.name).toBe('image.webp');
      expect(files[0].path).toBe('uploads/_transformations/webp/image.webp');
      expect(mockPhotonImage.free).toHaveBeenCalledTimes(1);
    });
  });
});
