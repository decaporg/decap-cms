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
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts' }),
          undefined,
          undefined,
        ),
      ).toEqual('static/media');
    });

    it('should return draft media folder when collection specifies media_folder and entry is undefined', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '' }),
          undefined,
          undefined,
        ),
      ).toEqual('posts/DRAFT_MEDIA_FILES');
    });

    it('should return relative media folder when collection specifies media_folder and entry path is not null', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '' }),
          Map({ path: 'posts/title/index.md' }),
          undefined,
        ),
      ).toEqual('posts/title');
    });

    it('should resolve collection relative media folder', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '../' }),
          Map({ path: 'posts/title/index.md' }),
          undefined,
        ),
      ).toEqual('posts/');
    });

    it('should return collection absolute media folder without leading slash', () => {
      expect(
        selectMediaFolder(
          Map({ media_folder: '/static/Images' }),
          Map({
            name: 'getting-started',
            folder: 'src/docs/getting-started',
            media_folder: '/static/images/docs/getting-started',
          }),
          Map({ path: 'src/docs/getting-started/with-github.md' }),
          undefined,
        ),
      ).toEqual('static/images/docs/getting-started');
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
          undefined,
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
          undefined,
        ),
      ).toEqual('static/images/docs/extending');
    });

    it('should compile field media folder template', () => {
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
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFolder(
          fromJS({ media_folder: 'static/media', slug: slugConfig }),
          collection,
          entry,
          '../../../{{media_folder}}/{{category}}/{{slug}}',
        ),
      ).toEqual('static/media/hosting-and-deployment/deployment-with-nanobox');
    });

    it('should handle double slashes', () => {
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
        media_folder: '{{media_folder}}/blog',
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFolder(
          fromJS({ media_folder: '/static/img/', slug: slugConfig }),
          collection,
          entry,
          undefined,
        ),
      ).toEqual('static/img/blog');

      expect(
        selectMediaFolder(
          fromJS({ media_folder: 'static/img/', slug: slugConfig }),
          collection,
          entry,
          undefined,
        ),
      ).toEqual('content/en/hosting-and-deployment/static/img/blog');
    });

    it('should handle file media_folder', () => {
      expect(
        selectMediaFolder(
          fromJS({ media_folder: 'static/media' }),
          fromJS({ name: 'posts', files: [{ name: 'index', media_folder: '/static/images/' }] }),
          fromJS({ path: 'posts/title/index.md', slug: 'index' }),
          undefined,
        ),
      ).toBe('static/images/');
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
          undefined,
          'image.png',
          undefined,
        ),
      ).toBe('static/media/image.png');
    });

    it('should resolve path from collection media folder for collection with media folder', () => {
      expect(
        selectMediaFilePath(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts', media_folder: '' }),
          undefined,
          'image.png',
          undefined,
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
          undefined,
        ),
      ).toBe('static/media/image.png');
    });

    it('should handle field media_folder', () => {
      expect(
        selectMediaFilePath(
          Map({ media_folder: 'static/media' }),
          Map({ name: 'posts', folder: 'posts' }),
          Map({ path: 'posts/title/index.md' }),
          'image.png',
          '../../static/media/',
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
        selectMediaFilePublicPath(
          Map({ public_folder: '/media' }),
          null,
          '/media/image.png',
          undefined,
          undefined,
        ),
      ).toBe('/media/image.png');
    });

    it('should resolve path from collection public folder for collection with public folder', () => {
      expect(
        selectMediaFilePublicPath(
          Map({ public_folder: '/media' }),
          Map({ name: 'posts', folder: 'posts', public_folder: '' }),
          'image.png',
          undefined,
          undefined,
        ),
      ).toBe('image.png');
    });

    it('should handle relative public_folder', () => {
      expect(
        selectMediaFilePublicPath(
          Map({ public_folder: '/media' }),
          Map({ name: 'posts', folder: 'posts', public_folder: '../../static/media/' }),
          'image.png',
          undefined,
          undefined,
        ),
      ).toBe('../../static/media/image.png');
    });

    it('should compile collection public folder template', () => {
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
          undefined,
        ),
      ).toEqual('/static/media/hosting-and-deployment/deployment-with-nanobox/image.png');
    });

    it('should compile field public folder template', () => {
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
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFilePublicPath(
          fromJS({ public_folder: 'static/media', slug: slugConfig }),
          collection,
          'image.png',
          entry,
          '/{{public_folder}}/{{category}}/{{slug}}',
        ),
      ).toEqual('/static/media/hosting-and-deployment/deployment-with-nanobox/image.png');
    });

    it('should handle double slashes', () => {
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
        fields: [{ name: 'title', widget: 'string' }],
      });

      expect(
        selectMediaFilePublicPath(
          fromJS({ public_folder: 'static/media/', slug: slugConfig }),
          collection,
          'image.png',
          entry,
          '/{{public_folder}}/{{category}}/{{slug}}',
        ),
      ).toEqual('/static/media/hosting-and-deployment/deployment-with-nanobox/image.png');
    });

    it('should handle file public_folder', () => {
      const entry = fromJS({
        path: 'src/posts/index.md',
        slug: 'index',
      });

      const collection = fromJS({
        name: 'posts',
        files: [
          {
            name: 'index',
            public_folder: '/images',
            fields: [{ name: 'title', widget: 'string' }],
          },
        ],
      });

      expect(
        selectMediaFilePublicPath(
          fromJS({ public_folder: 'static/media/' }),
          collection,
          'image.png',
          entry,
          undefined,
        ),
      ).toBe('/images/image.png');
    });
  });
});
