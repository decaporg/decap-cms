import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';
import { insertMedia } from '../mediaLibrary';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mediaLibrary', () => {
  describe('insertMedia', () => {
    it('test public URL is returned directly', () => {
      const store = mockStore({});
      store.dispatch(insertMedia({ url: '//localhost/foo.png' }));
      expect(store.getActions()[0]).toEqual({
        type: 'MEDIA_INSERT',
        payload: { mediaPath: '//localhost/foo.png' },
      });
    });

    it('Test relative path resolution', () => {
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

    // media_folder_relative will be used even if public_folder is specified
    it('Test relative path resolution, with public folder specified', () => {
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

    it('Test public_folder resolution', () => {
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

    it('Test incorrect usage', () => {
      const store = mockStore();

      try {
        store.dispatch(insertMedia({ foo: 'foo.png' }));
        throw new Error('Expected Exception');
      } catch (e) {
        expect(e.message).toEqual('Incorrect usage, expected {url} or {file}');
      }
    });
  });
});
