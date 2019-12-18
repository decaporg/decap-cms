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
      expect(applyDefaults(config).get('publish_mode')).toEqual('simple');
    });

    it('should set publish_mode from config', () => {
      const config = fromJS({
        foo: 'bar',
        publish_mode: 'complex',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
        collections: [],
      });
      expect(applyDefaults(config).get('publish_mode')).toEqual('complex');
    });

    it('should set public_folder based on media_folder if not set', () => {
      expect(
        applyDefaults(
          fromJS({
            foo: 'bar',
            media_folder: 'path/to/media',
            collections: [],
          }),
        ).get('public_folder'),
      ).toEqual('/path/to/media');
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
        ).get('public_folder'),
      ).toEqual('/publib/path');
    });

    it('should strip leading slashes from collection folder', () => {
      expect(
        applyDefaults(
          fromJS({
            collections: [{ folder: '/foo' }],
          }),
        ).get('collections'),
      ).toEqual(fromJS([{ folder: 'foo' }]));
    });

    it('should strip leading slashes from collection files', () => {
      expect(
        applyDefaults(
          fromJS({
            collections: [{ files: [{ file: '/foo' }] }],
          }),
        ).get('collections'),
      ).toEqual(fromJS([{ files: [{ file: 'foo' }] }]));
    });

    it('should set default slug config', () => {
      expect(applyDefaults(fromJS({ collections: [] })).get('slug')).toEqual(
        fromJS({ encoding: 'unicode', clean_accents: false, sanitize_replacement: '-' }),
      );
    });

    it('should not override slug encoding', () => {
      expect(
        applyDefaults(fromJS({ collections: [], slug: { encoding: 'ascii' } })).getIn([
          'slug',
          'encoding',
        ]),
      ).toEqual('ascii');
    });

    it('should not override slug clean_accents', () => {
      expect(
        applyDefaults(fromJS({ collections: [], slug: { clean_accents: true } })).getIn([
          'slug',
          'clean_accents',
        ]),
      ).toEqual(true);
    });

    it('should not override slug sanitize_replacement', () => {
      expect(
        applyDefaults(fromJS({ collections: [], slug: { sanitize_replacement: '_' } })).getIn([
          'slug',
          'sanitize_replacement',
        ]),
      ).toEqual('_');
    });
  });
});
