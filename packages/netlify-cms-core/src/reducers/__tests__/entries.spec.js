import { Map, OrderedMap, fromJS } from 'immutable';
import * as actions from 'Actions/entries';
import reducer, {
  selectMediaFolder,
  selectMediaFilePath,
  selectMediaFilePublicPath,
} from '../entries';

const initialState = OrderedMap({
  posts: Map({ name: 'posts' }),
});

describe('entries', () => {
  describe('reducer', () => {
    it('should mark entries as fetching', () => {
      expect(reducer(initialState, actions.entriesLoading(Map({ name: 'posts' })))).toEqual(
        OrderedMap(
          fromJS({
            posts: { name: 'posts' },
            pages: {
              posts: { isFetching: true },
            },
          }),
        ),
      );
    });

    it('should handle loaded entries', () => {
      const entries = [
        { slug: 'a', path: '' },
        { slug: 'b', title: 'B' },
      ];
      expect(
        reducer(initialState, actions.entriesLoaded(Map({ name: 'posts' }), entries, 0)),
      ).toEqual(
        OrderedMap(
          fromJS({
            posts: { name: 'posts' },
            entities: {
              'posts.a': { slug: 'a', path: '', isFetching: false },
              'posts.b': { slug: 'b', title: 'B', isFetching: false },
            },
            pages: {
              posts: {
                page: 0,
                ids: ['a', 'b'],
              },
            },
          }),
        ),
      );
    });

    it('should handle loaded entry', () => {
      const entry = { slug: 'a', path: '' };
      expect(reducer(initialState, actions.entryLoaded(Map({ name: 'posts' }), entry))).toEqual(
        OrderedMap(
          fromJS({
            posts: { name: 'posts' },
            entities: {
              'posts.a': { slug: 'a', path: '' },
            },
            pages: {
              posts: {
                ids: ['a'],
              },
            },
          }),
        ),
      );
    });
  });

  describe('selectMediaFolder', () => {
    it("should return global media folder when collection doesn't specify media_folder", () => {
      expect(
        selectMediaFolder(Map({ media_folder: 'static/media' }), Map({ name: 'posts' })),
      ).toEqual('static/media');
    });

    it('should return draft media folder when collection specifies media_folder and entry path is null', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '' }),
          null,
        ),
      ).toEqual('posts/DRAFT_MEDIA_FILES');
    });

    it('should return relative media folder when collection specifies media_folder and entry path is not null', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '' }),
          Map({ path: 'posts/title/index.md' }),
        ),
      ).toEqual('posts/title');
    });

    it('should resolve collection relative media folder', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '../' }),
          Map({ path: 'posts/title/index.md' }),
        ),
      ).toEqual('posts/');
    });

    it('should return collection absolute media folder as is', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: '/static/Images' }),
          Map({
            name: 'getting-started',
            folder: 'src/docs/getting-started',
            media_folder: '/static/images/docs/getting-started',
          }),
          Map({ path: 'src/docs/getting-started/with-github.md' }),
        ),
      ).toEqual('/static/images/docs/getting-started');
    });

    it('should compile relative media folder template', () => {
      const slugConfig = {
        encoding: 'unicode',
        clean_accents: false,
        sanitize_replacement: '-',
      };

      const entry = fromJS({
        path: 'content/en/hosting-and-deployment/deployment-with-nanobox.md',
        data: { title: 'Deployment With NanoBox', category: 'Hosting And Deployment' },
      });
      const collection = fromJS({
        name: 'posts',
        folder: 'content',
        media_folder: '../../../{{media_folder}}/{{category}}/{{slug}}',
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFolder(
          fromJS({ media_folder: 'static/media', slug: slugConfig }),
          collection,
          entry,
        ),
      ).toEqual('static/media/hosting-and-deployment/deployment-with-nanobox');
    });

    it('should compile absolute media folder template', () => {
      const slugConfig = {
        encoding: 'unicode',
        clean_accents: false,
        sanitize_replacement: '-',
      };

      const entry = fromJS({
        path: 'src/docs/extending/overview.md',
        data: { title: 'Overview' },
      });
      const collection = fromJS({
        name: 'extending',
        folder: 'src/docs/extending',
        media_folder: '{{media_folder}}/docs/extending',
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFolder(
          fromJS({ media_folder: '/static/images', slug: slugConfig }),
          collection,
          entry,
        ),
      ).toEqual('/static/images/docs/extending');
    });
  });

  describe('selectMediaFilePath', () => {
    it('should return absolute URL as is', () => {
      expect(selectMediaFilePath(null, null, null, 'https://www.netlify.com/image.png')).toBe(
        'https://www.netlify.com/image.png',
      );
    });

    it('should resolve path from global media folder for collection with no media folder', () => {
      expect(
        selectMediaFilePath(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts' }),
          null,
          'image.png',
        ),
      ).toBe('static/media/image.png');
    });

    it('should resolve path from collection media folder for collection with media folder', () => {
      expect(
        selectMediaFilePath(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '' }),
          null,
          'image.png',
        ),
      ).toBe('posts/DRAFT_MEDIA_FILES/image.png');
    });

    it('should handle relative media_folder', () => {
      expect(
        selectMediaFilePath(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '../../static/media/' }),
          Map({ path: 'posts/title/index.md' }),
          'image.png',
        ),
      ).toBe('static/media/image.png');
    });
  });

  describe('selectMediaFilePublicPath', () => {
    it('should return absolute URL as is', () => {
      expect(selectMediaFilePublicPath(null, null, 'https://www.netlify.com/image.png')).toBe(
        'https://www.netlify.com/image.png',
      );
    });

    it('should resolve path from public folder for collection with no media folder', () => {
      expect(
        selectMediaFilePublicPath(Map({ public_folder: '/media' }), null, '/media/image.png'),
      ).toBe('/media/image.png');
    });

    it('should resolve path from collection public folder for collection with public folder', () => {
      expect(
        selectMediaFilePublicPath(
          Map({ public_folder: '/media' }),
          Map({ name: 'posts', folder: 'posts', public_folder: '' }),
          'image.png',
        ),
      ).toBe('image.png');
    });

    it('should handle relative public_folder', () => {
      expect(
        selectMediaFilePublicPath(
          Map({ public_folder: '/media' }),
          Map({ name: 'posts', folder: 'posts', public_folder: '../../static/media/' }),
          'image.png',
        ),
      ).toBe('../../static/media/image.png');
    });

    it('should compile public folder template', () => {
      const slugConfig = {
        encoding: 'unicode',
        clean_accents: false,
        sanitize_replacement: '-',
      };

      const entry = fromJS({
        path: 'content/en/hosting-and-deployment/deployment-with-nanobox.md',
        data: { title: 'Deployment With NanoBox', category: 'Hosting And Deployment' },
      });
      const collection = fromJS({
        name: 'posts',
        folder: 'content',
        public_folder: '/{{public_folder}}/{{category}}/{{slug}}',
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFilePublicPath(
          fromJS({ public_folder: 'static/media', slug: slugConfig }),
          collection,
          'image.png',
          entry,
        ),
      ).toEqual('/static/media/hosting-and-deployment/deployment-with-nanobox/image.png');
    });
  });
});
