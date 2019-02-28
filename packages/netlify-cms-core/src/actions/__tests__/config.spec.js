import { fromJS } from 'immutable';
import { applyDefaults } from '../config';

describe('config', () => {
  describe('applyDefaults', () => {
    it('should set publish_mode if not set', () => {
      const config = fromJS({
        foo: 'bar',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
        collections: [],
      });
      expect(applyDefaults(config)).toEqual(config.set('publish_mode', 'simple'));
    });

    it('should set publish_mode from config', () => {
      const config = fromJS({
        foo: 'bar',
        publish_mode: 'complex',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
        collections: [],
      });
      expect(applyDefaults(config)).toEqual(config);
    });

    it('should set public_folder based on media_folder if not set', () => {
      expect(
        applyDefaults(
          fromJS({
            foo: 'bar',
            media_folder: 'path/to/media',
            collections: [],
          }),
        ),
      ).toEqual(
        fromJS({
          foo: 'bar',
          publish_mode: 'simple',
          media_folder: 'path/to/media',
          public_folder: '/path/to/media',
          collections: [],
        }),
      );
    });

    it('should not overwrite public_folder if set', () => {
      expect(
        applyDefaults(
          fromJS({
            foo: 'bar',
            media_folder: 'path/to/media',
            public_folder: '/publib/path',
            collections: [],
          }),
        ),
      ).toEqual(
        fromJS({
          foo: 'bar',
          publish_mode: 'simple',
          media_folder: 'path/to/media',
          public_folder: '/publib/path',
          collections: [],
        }),
      );
    });

    it('should strip leading slashes from collection folder', () => {
      expect(
        applyDefaults(
          fromJS({
            collections: [{ folder: '/foo' }],
          }),
        ),
      ).toEqual(
        fromJS({
          publish_mode: 'simple',
          public_folder: '/',
          collections: [{ folder: 'foo' }],
        }),
      );
    });

    it('should strip leading slashes from collection files', () => {
      expect(
        applyDefaults(
          fromJS({
            collections: [{ files: [{ file: '/foo' }] }],
          }),
        ),
      ).toEqual(
        fromJS({
          publish_mode: 'simple',
          public_folder: '/',
          collections: [{ files: [{ file: 'foo' }] }],
        }),
      );
    });
  });
});
