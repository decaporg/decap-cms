import { fromJS } from 'immutable';
import { applyDefaults, validateConfig } from '../config';

describe('config', () => {
  describe('applyDefaults', () => {
    it('should set publish_mode if not set', () => {
      const config = fromJS({
        foo: 'bar',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
      expect(
        applyDefaults(config)
      ).toEqual(
        config.set('publish_mode', 'simple')
      );
    });

    it('should set publish_mode from config', () => {
      const config = fromJS({
        foo: 'bar',
        publish_mode: 'complex',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
      expect(
        applyDefaults(config)
      ).toEqual(
        config
      );
    });

    it('should set public_folder based on media_folder if not set', () => {
      expect(applyDefaults(fromJS({
        foo: 'bar',
        media_folder: 'path/to/media',
      }))).toEqual(fromJS({
        foo: 'bar',
        publish_mode: 'simple',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      }));
    });

    it('should not overwrite public_folder if set', () => {
      expect(applyDefaults(fromJS({
        foo: 'bar',
        media_folder: 'path/to/media',
        public_folder: '/publib/path',
      }))).toEqual(fromJS({
        foo: 'bar',
        publish_mode: 'simple',
        media_folder: 'path/to/media',
        public_folder: '/publib/path',
      }));
    });
  });

  describe('validateConfig', () => {
    it('should return the config if no errors', () => {
      const config = fromJS({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz', collections: [{}] });
      expect(
        validateConfig(config)
      ).toEqual(config);
    });

    it('should throw if backend is not defined in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar' }));
      }).toThrowError('Error in configuration file: A `backend` wasn\'t found. Check your config.yml file.');
    });

    it('should throw if backend name is not defined in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: {} }));
      }).toThrowError('Error in configuration file: A `backend.name` wasn\'t found. Check your config.yml file.');
    });

    it('should throw if backend name is not a string in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: { } } }));
      }).toThrowError('Error in configuration file: Your `backend.name` must be a string. Check your config.yml file.');
    });

    it('should throw if media_folder is not defined in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: 'bar' } }));
      }).toThrowError('Error in configuration file: A `media_folder` wasn\'t found. Check your config.yml file.');
    });

    it('should throw if media_folder is not a string in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: 'bar' }, media_folder: {} }));
      }).toThrowError('Error in configuration file: Your `media_folder` must be a string. Check your config.yml file.');
    });

    it('should throw if collections is not defined in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz' }));
      }).toThrowError('Error in configuration file: A `collections` wasn\'t found. Check your config.yml file.');
    });

    it('should throw if collections not an array in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz', collections: {} }));
      }).toThrowError('Error in configuration file: Your `collections` must be an array with at least one element. Check your config.yml file.');
    });

    it('should throw if collections is an empty array in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz', collections: [] }));
      }).toThrowError('Error in configuration file: Your `collections` must be an array with at least one element. Check your config.yml file.');
    });

    it('should throw if collections is an array with a single null element in config', () => {
      expect(() => {
        validateConfig(fromJS({ foo: 'bar', backend: { name: 'bar' }, media_folder: 'baz', collections: [null] }));
      }).toThrowError('Error in configuration file: Your `collections` must be an array with at least one element. Check your config.yml file.');
    });
  });
});