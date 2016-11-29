import * as config from '../config';

describe('config', () => {
  describe('applyDefaults', () => {
    it('should throw if media_folder is not defined in config', () => {
      expect(() => {
        config.applyDefaults({ foo: 'bar' });
      }).toThrowError('Error in configuration file: A `media_folder` wasn\'t found. Check your config.yml file.');
    });

    it('should set publish_mode if not set', () => {
      expect(config.applyDefaults({
        foo: 'bar',
        media_folder: 'path/to/media',
      })).toEqual({
        foo: 'bar',
        publish_mode: 'simple',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
    });

    it('should set publish_mode from config', () => {
      expect(config.applyDefaults({
        foo: 'bar',
        publish_mode: 'complex',
        media_folder: 'path/to/media',
      })).toEqual({
        foo: 'bar',
        publish_mode: 'complex',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
    });

    it('should set public_folder based on media_folder if not set', () => {
      expect(config.applyDefaults({
        foo: 'bar',
        media_folder: 'path/to/media',
      })).toEqual({
        foo: 'bar',
        publish_mode: 'simple',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
    });

    it('should not overwrite public_folder if set', () => {
      expect(config.applyDefaults({
        foo: 'bar',
        media_folder: 'path/to/media',
        public_folder: '/publib/path',
      })).toEqual({
        foo: 'bar',
        publish_mode: 'simple',
        media_folder: 'path/to/media',
        public_folder: '/publib/path',
      });
    });
  });
});
