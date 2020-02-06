import { OrderedMap, fromJS, Map } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, {
  selectAllowDeletion,
  selectEntryPath,
  selectEntrySlug,
  selectMediaLibraryConfigs,
} from '../collections';
import { FILES, FOLDER } from 'Constants/collectionTypes';

describe('collections', () => {
  it('should handle an empty state', () => {
    expect(collections(undefined, {})).toEqual(null);
  });

  it('should load the collections from the config', () => {
    expect(
      collections(
        undefined,
        configLoaded(
          fromJS({
            collections: [
              {
                name: 'posts',
                folder: '_posts',
                fields: [{ name: 'title', widget: 'string' }],
              },
            ],
          }),
        ),
      ),
    ).toEqual(
      OrderedMap({
        posts: fromJS({
          name: 'posts',
          folder: '_posts',
          fields: [{ name: 'title', widget: 'string' }],
          type: FOLDER,
        }),
      }),
    );
  });

  describe('selectAllowDeletions', () => {
    it('should not allow deletions for file collections', () => {
      expect(
        selectAllowDeletion(
          fromJS({
            name: 'pages',
            type: FILES,
          }),
        ),
      ).toBe(false);
    });
  });

  describe('selectEntryPath', () => {
    it('should return path', () => {
      expect(
        selectEntryPath(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'dir1/dir2/slug',
        ),
      ).toBe('posts/dir1/dir2/slug.md');
    });
  });

  describe('selectEntrySlug', () => {
    it('should return slug', () => {
      expect(
        selectEntrySlug(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'posts/dir1/dir2/slug.md',
        ),
      ).toBe('dir1/dir2/slug');
    });
  });

  describe('selectMediaLibraryConfigs', () => {
    it('should return empty array for invalid collection', () => {
      expect(selectMediaLibraryConfigs(fromJS({}))).toEqual([]);
    });

    it('should return configs for folder collection', () => {
      expect(
        selectMediaLibraryConfigs(
          fromJS({
            folder: 'posts',
            fields: [
              {
                name: 'image',
                media_library: {
                  config: {
                    media_folder: 'image_media_folder',
                    public_folder: 'image_public_folder',
                  },
                },
              },
              {
                name: 'body',
                media_library: {
                  config: {
                    media_folder: 'body_media_folder',
                    public_folder: 'body_public_folder',
                  },
                },
              },
              {
                name: 'list_1',
                field: {
                  name: 'list_1_item',
                  media_library: {
                    config: {
                      media_folder: 'list_1_item_media_folder',
                      public_folder: 'list_1_item_public_folder',
                    },
                  },
                },
              },
              {
                name: 'list_2',
                fields: [
                  {
                    name: 'list_2_item',
                    media_library: {
                      config: {
                        media_folder: 'list_2_item_media_folder',
                        public_folder: 'list_2_item_public_folder',
                      },
                    },
                  },
                ],
              },
            ],
          }),
        ),
      ).toEqual([
        Map({
          media_folder: 'image_media_folder',
          public_folder: 'image_public_folder',
        }),
        Map({
          media_folder: 'body_media_folder',
          public_folder: 'body_public_folder',
        }),
        Map({
          media_folder: 'list_1_item_media_folder',
          public_folder: 'list_1_item_public_folder',
        }),
        Map({
          media_folder: 'list_2_item_media_folder',
          public_folder: 'list_2_item_public_folder',
        }),
      ]);
    });

    it('should return configs for files collection', () => {
      expect(
        selectMediaLibraryConfigs(
          fromJS({
            files: [
              {
                fields: [
                  {
                    name: 'image',
                    media_library: {
                      config: {
                        media_folder: 'image_media_folder',
                        public_folder: 'image_public_folder',
                      },
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'body',
                    media_library: {
                      config: {
                        media_folder: 'body_media_folder',
                        public_folder: 'body_public_folder',
                      },
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'list_1',
                    field: {
                      name: 'list_1_item',
                      media_library: {
                        config: {
                          media_folder: 'list_1_item_media_folder',
                          public_folder: 'list_1_item_public_folder',
                        },
                      },
                    },
                  },
                ],
              },
              {
                fields: [
                  {
                    name: 'list_2',
                    fields: [
                      {
                        name: 'list_2_item',
                        media_library: {
                          config: {
                            media_folder: 'list_2_item_media_folder',
                            public_folder: 'list_2_item_public_folder',
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ),
      ).toEqual([
        Map({
          media_folder: 'image_media_folder',
          public_folder: 'image_public_folder',
        }),
        Map({
          media_folder: 'body_media_folder',
          public_folder: 'body_public_folder',
        }),
        Map({
          media_folder: 'list_1_item_media_folder',
          public_folder: 'list_1_item_public_folder',
        }),
        Map({
          media_folder: 'list_2_item_media_folder',
          public_folder: 'list_2_item_public_folder',
        }),
      ]);
    });
  });
});
