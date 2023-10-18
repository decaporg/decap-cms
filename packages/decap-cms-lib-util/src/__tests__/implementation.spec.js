import { getMediaAsBlob, getMediaDisplayURL } from '../implementation';

describe('implementation', () => {
  describe('getMediaAsBlob', () => {
    it('should return response blob on non svg file', async () => {
      const blob = {};
      const readFile = jest.fn().mockResolvedValue(blob);

      await expect(getMediaAsBlob('static/media/image.png', 'sha', readFile)).resolves.toBe(blob);

      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith('static/media/image.png', 'sha', {
        parseText: false,
      });
    });

    it('should return text blob on svg file', async () => {
      const text = 'svg';
      const readFile = jest.fn().mockResolvedValue(text);

      await expect(getMediaAsBlob('static/media/logo.svg', 'sha', readFile)).resolves.toEqual(
        new Blob([text], { type: 'image/svg+xml' }),
      );

      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith('static/media/logo.svg', 'sha', {
        parseText: true,
      });
    });
  });

  describe('getMediaDisplayURL', () => {
    it('should return createObjectURL result', async () => {
      const blob = {};
      const readFile = jest.fn().mockResolvedValue(blob);
      const semaphore = { take: jest.fn(callback => callback()), leave: jest.fn() };

      global.URL.createObjectURL = jest
        .fn()
        .mockResolvedValue('blob:http://localhost:8080/blob-id');

      await expect(
        getMediaDisplayURL({ path: 'static/media/image.png', id: 'sha' }, readFile, semaphore),
      ).resolves.toBe('blob:http://localhost:8080/blob-id');

      expect(semaphore.take).toHaveBeenCalledTimes(1);
      expect(semaphore.leave).toHaveBeenCalledTimes(1);

      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith('static/media/image.png', 'sha', {
        parseText: false,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });
  });
});
