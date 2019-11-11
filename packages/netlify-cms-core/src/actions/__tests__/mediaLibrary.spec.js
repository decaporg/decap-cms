import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';
import { insertMedia } from '../mediaLibrary';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mediaLibrary', () => {
  describe('insertMedia', () => {
    it('should return url when input is an object with url property', () => {
      const store = mockStore({});
      store.dispatch(insertMedia({ url: '//localhost/foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '//localhost/foo.png' },
      });
    });

    it('should resolve to relative path when media_folder_relative is true and object with name property is given', () => {
      const store = mockStore({
        config: fromJS({
          media_folder_relative: true,
          media_folder: 'content/media',
        }),
        entryDraft: fromJS({
          entry: {
            collection: 'blog-posts',
          },
        }),
        collections: fromJS({
          'blog-posts': {
            folder: 'content/blog/posts',
          },
        }),
      });
      store.dispatch(insertMedia({ name: 'foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '../../media/foo.png' },
      });
    });

    it('should resolve to relative path and ignore public_folder when media_folder_relative is true', () => {
      const store = mockStore({
        config: fromJS({
          media_folder_relative: true,
          media_folder: 'content/media',
          public_folder: '/static/assets/media',
        }),
        entryDraft: fromJS({
          entry: {
            collection: 'blog-posts',
          },
        }),
        collections: fromJS({
          'blog-posts': {
            folder: 'content/blog/posts',
          },
        }),
      });
      store.dispatch(insertMedia({ name: 'foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '../../media/foo.png' },
      });
    });

    it('should not resolve to relative path when media_folder_relative is not true', () => {
      const store = mockStore({
        config: fromJS({
          public_folder: '/static/assets/media',
        }),
      });
      store.dispatch(insertMedia({ name: 'foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '/static/assets/media/foo.png' },
      });
    });

    it('should return mediaPath as string when string is given', () => {
      const store = mockStore({});
      store.dispatch(insertMedia('foo.png'));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: 'foo.png' },
      });
    });

    it('should return mediaPath as array of strings when array of strings is given', () => {
      const store = mockStore({});
      store.dispatch(insertMedia(['foo.png']));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: ['foo.png'] },
      });
    });

    it('should throw an error when not a object with url or name property, a string or a string array', () => {
      const store = mockStore();

      expect.assertions(1);
      try {
        store.dispatch(insertMedia({ foo: 'foo.png' }));
      } catch (e) {
        expect(e.message).toEqual(
          'Incorrect usage, expected {url}, {file}, string or string array',
        );
      }
    });
  });
});
