import { fromJS } from 'immutable';
import { applyDefaults } from '../config';

describe('config', () => {
  describe('applyDefaults', () => {
    it('should set publish_mode if not set', () => {
      const config = fromJS({
        foo: 'bar',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
      expect(applyDefaults(config)).toEqual(config.set('publish_mode', 'simple'));
    });

    it('should set publish_mode from config', () => {
      const config = fromJS({
        foo: 'bar',
        publish_mode: 'complex',
        media_folder: 'path/to/media',
        public_folder: '/path/to/media',
      });
      expect(applyDefaults(config)).toEqual(config);
    });

    it('should set public_folder based on media_folder if not set', () => {
      expect(
        applyDefaults(
          fromJS({
            foo: 'bar',
            media_folder: 'path/to/media',
          }),
        ),
      ).toEqual(
        fromJS({
          foo: 'bar',
          publish_mode: 'simple',
          media_folder: 'path/to/media',
          public_folder: '/path/to/media',
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
          }),
        ),
      ).toEqual(
        fromJS({
          foo: 'bar',
          publish_mode: 'simple',
          media_folder: 'path/to/media',
          public_folder: '/publib/path',
        }),
      );
    });
  });
});
