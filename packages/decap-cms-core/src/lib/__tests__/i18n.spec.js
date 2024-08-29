import { fromJS } from 'immutable';

import * as i18n from '../i18n';

jest.mock('../../reducers/collections', () => {
  return {
    selectEntrySlug: () => 'index',
  };
});

describe('i18n', () => {
  describe('hasI18n', () => {
    it('should return false for collection with no i18n', () => {
      expect(i18n.hasI18n(fromJS({}))).toBe(false);
    });

    it('should return true for collection with i18n', () => {
      expect(i18n.hasI18n(fromJS({ i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE } }))).toBe(
        true,
      );
    });
  });

  describe('getI18nInfo', () => {
    it('should return empty object for collection with no i18n', () => {
      expect(i18n.getI18nInfo(fromJS({}))).toEqual({});
    });

    it('should return i18n object for collection with i18n', () => {
      const i18nObject = {
        locales: ['en', 'de'],
        default_locale: 'en',
        structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS,
      };
      expect(i18n.getI18nInfo(fromJS({ i18n: i18nObject }))).toEqual({
        locales: ['en', 'de'],
        defaultLocale: 'en',
        structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS,
      });
    });
  });

  describe('getI18nFilesDepth', () => {
    it('should increase depth when i18n structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      expect(
        i18n.getI18nFilesDepth(
          fromJS({ i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS } }),
          5,
        ),
      ).toBe(6);
    });

    it('should return current depth when i18n structure is not I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      expect(
        i18n.getI18nFilesDepth(
          fromJS({ i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FILES } }),
          5,
        ),
      ).toBe(5);
      expect(
        i18n.getI18nFilesDepth(fromJS({ i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE } }), 5),
      ).toBe(5);
      expect(i18n.getI18nFilesDepth(fromJS({}), 5)).toBe(5);
    });
  });

  describe('isFieldTranslatable', () => {
    it('should return true when not default locale and has I18N_FIELD.TRANSLATE', () => {
      expect(
        i18n.isFieldTranslatable(fromJS({ i18n: i18n.I18N_FIELD.TRANSLATE }), 'en', 'de'),
      ).toBe(true);
    });

    it('should return false when default locale and has I18N_FIELD.TRANSLATE', () => {
      expect(
        i18n.isFieldTranslatable(fromJS({ i18n: i18n.I18N_FIELD.TRANSLATE }), 'en', 'en'),
      ).toBe(false);
    });

    it("should return false when doesn't have i18n", () => {
      expect(i18n.isFieldTranslatable(fromJS({}), 'en', 'en')).toBe(false);
    });
  });

  describe('isFieldDuplicate', () => {
    it('should return true when not default locale and has I18N_FIELD.TRANSLATE', () => {
      expect(i18n.isFieldDuplicate(fromJS({ i18n: i18n.I18N_FIELD.DUPLICATE }), 'en', 'de')).toBe(
        true,
      );
    });

    it('should return false when default locale and has I18N_FIELD.TRANSLATE', () => {
      expect(i18n.isFieldDuplicate(fromJS({ i18n: i18n.I18N_FIELD.DUPLICATE }), 'en', 'en')).toBe(
        false,
      );
    });

    it("should return false when doesn't have i18n", () => {
      expect(i18n.isFieldDuplicate(fromJS({}), 'en', 'en')).toBe(false);
    });
  });

  describe('isFieldHidden', () => {
    it('should return true when not default locale and has I18N_FIELD.NONE', () => {
      expect(i18n.isFieldHidden(fromJS({ i18n: i18n.I18N_FIELD.NONE }), 'en', 'de')).toBe(true);
    });

    it('should return false when default locale and has I18N_FIELD.NONE', () => {
      expect(i18n.isFieldHidden(fromJS({ i18n: i18n.I18N_FIELD.NONE }), 'en', 'en')).toBe(false);
    });

    it("should return false when doesn't have i18n", () => {
      expect(i18n.isFieldHidden(fromJS({}), 'en', 'en')).toBe(false);
    });
  });

  describe('getLocaleDataPath', () => {
    it('should return string array with locale as part of the data path', () => {
      expect(i18n.getLocaleDataPath('de')).toEqual(['i18n', 'de', 'data']);
    });
  });

  describe('getDataPath', () => {
    it('should not include locale in path for default locale', () => {
      expect(i18n.getDataPath('en', 'en')).toEqual(['data']);
    });

    it('should include locale in path for non default locale', () => {
      expect(i18n.getDataPath('de', 'en')).toEqual(['i18n', 'de', 'data']);
    });
  });

  describe('getFilePath', () => {
    it('should return directory path based on locale when structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      expect(
        i18n.getFilePath(
          i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS,
          'md',
          'src/content/index.md',
          'index',
          'de',
        ),
      ).toEqual('src/content/de/index.md');
    });

    it('should return file path based on locale when structure is I18N_STRUCTURE.MULTIPLE_FILES', () => {
      expect(
        i18n.getFilePath(
          i18n.I18N_STRUCTURE.MULTIPLE_FILES,
          'md',
          'src/content/file-with-md-in-the-name.md',
          'file-with-md-in-the-name',
          'de',
        ),
      ).toEqual('src/content/file-with-md-in-the-name.de.md');
    });

    it('should not modify path when structure is I18N_STRUCTURE.SINGLE_FILE', () => {
      expect(
        i18n.getFilePath(
          i18n.I18N_STRUCTURE.SINGLE_FILE,
          'md',
          'src/content/index.md',
          'index',
          'de',
        ),
      ).toEqual('src/content/index.md');
    });
  });

  describe('getFilePaths', () => {
    const args = ['md', 'src/content/index.md', 'index'];

    it('should return file paths for all locales', () => {
      expect(
        i18n.getFilePaths(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS, locales: ['en', 'de'] },
          }),
          ...args,
        ),
      ).toEqual(['src/content/en/index.md', 'src/content/de/index.md']);
    });

    it('should return array with single path when structure is I18N_STRUCTURE.SINGLE_FILE', () => {
      expect(
        i18n.getFilePaths(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE, locales: ['en', 'de'] },
          }),
          ...args,
        ),
      ).toEqual(['src/content/index.md']);
    });
  });

  describe('normalizeFilePath', () => {
    it('should remove locale folder from path when structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      expect(
        i18n.normalizeFilePath(
          i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS,
          'src/content/en/index.md',
          'en',
        ),
      ).toEqual('src/content/index.md');
    });

    it('should remove locale extension from path when structure is I18N_STRUCTURE.MULTIPLE_FILES', () => {
      expect(
        i18n.normalizeFilePath(i18n.I18N_STRUCTURE.MULTIPLE_FILES, 'src/content/index.en.md', 'en'),
      ).toEqual('src/content/index.md');
    });

    it('should not modify path when structure is I18N_STRUCTURE.SINGLE_FILE', () => {
      expect(
        i18n.normalizeFilePath(i18n.I18N_STRUCTURE.SINGLE_FILE, 'src/content/index.md', 'en'),
      ).toEqual('src/content/index.md');
    });
  });

  describe('getLocaleFromPath', () => {
    it('should return the locale from folder name in the path when structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      expect(
        i18n.getLocaleFromPath(
          i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS,
          'md',
          'src/content/en/index.md',
        ),
      ).toEqual('en');
    });

    it('should return the locale extension from the file name when structure is I18N_STRUCTURE.MULTIPLE_FILES', () => {
      expect(
        i18n.getLocaleFromPath(i18n.I18N_STRUCTURE.MULTIPLE_FILES, 'md', 'src/content/index.en.md'),
      ).toEqual('en');
    });

    it('issue #5909: return the correct locale extension for language gd', () => {
      expect(
        i18n.getLocaleFromPath(i18n.I18N_STRUCTURE.MULTIPLE_FILES, 'md', 'src/content/index.gd.md'),
      ).toEqual('gd');
    });

    it('should return an empty string when structure is I18N_STRUCTURE.SINGLE_FILE', () => {
      expect(
        i18n.getLocaleFromPath(i18n.I18N_STRUCTURE.SINGLE_FILE, 'md', 'src/content/index.md'),
      ).toEqual('');
    });
  });

  describe('getI18nFiles', () => {
    const locales = ['en', 'de', 'fr'];
    const default_locale = 'en';
    const args = [
      'md',
      fromJS({
        data: { title: 'en_title' },
        i18n: { de: { data: { title: 'de_title' } }, fr: { data: { title: 'fr_title' } } },
      }),
      map => map.get('data').toJS(),
      'src/content/index.md',
      'index',
    ];
    it('should return a single file when structure is I18N_STRUCTURE.SINGLE_FILE', () => {
      expect(
        i18n.getI18nFiles(
          fromJS({ i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE, locales, default_locale } }),
          ...args,
        ),
      ).toEqual([
        {
          path: 'src/content/index.md',
          raw: {
            en: { title: 'en_title' },
            de: { title: 'de_title' },
            fr: { title: 'fr_title' },
          },
          slug: 'index',
        },
      ]);
    });

    it('should return a folder based files when structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      expect(
        i18n.getI18nFiles(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS, locales, default_locale },
          }),
          ...args,
        ),
      ).toEqual([
        {
          path: 'src/content/en/index.md',
          raw: { title: 'en_title' },
          slug: 'index',
        },
        {
          path: 'src/content/de/index.md',
          raw: { title: 'de_title' },
          slug: 'index',
        },
        {
          path: 'src/content/fr/index.md',
          raw: { title: 'fr_title' },
          slug: 'index',
        },
      ]);
    });

    it('should return a extension based files when structure is I18N_STRUCTURE.MULTIPLE_FILES', () => {
      expect(
        i18n.getI18nFiles(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FILES, locales, default_locale },
          }),
          ...args,
        ),
      ).toEqual([
        {
          path: 'src/content/index.en.md',
          raw: { title: 'en_title' },
          slug: 'index',
        },
        {
          path: 'src/content/index.de.md',
          raw: { title: 'de_title' },
          slug: 'index',
        },
        {
          path: 'src/content/index.fr.md',
          raw: { title: 'fr_title' },
          slug: 'index',
        },
      ]);
    });
  });

  describe('getI18nEntry', () => {
    const locales = ['en', 'de', 'fr', 'es'];
    const default_locale = 'en';
    const args = ['md', 'src/content/index.md', 'index'];

    it('should return i18n entry content when structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', async () => {
      const data = {
        'src/content/en/index.md': {
          slug: 'index',
          path: 'src/content/en/index.md',
          data: { title: 'en_title' },
        },
        'src/content/de/index.md': {
          slug: 'index',
          path: 'src/content/de/index.md',
          data: { title: 'de_title' },
        },
        'src/content/fr/index.md': {
          slug: 'index',
          path: 'src/content/fr/index.md',
          data: { title: 'fr_title' },
        },
      };
      const getEntryValue = jest.fn(path =>
        data[path] ? Promise.resolve(data[path]) : Promise.reject('Not found'),
      );

      await expect(
        i18n.getI18nEntry(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS, locales, default_locale },
          }),
          ...args,
          getEntryValue,
        ),
      ).resolves.toEqual({
        slug: 'index',
        path: 'src/content/index.md',
        data: { title: 'en_title' },
        i18n: {
          de: { data: { title: 'de_title' } },
          fr: { data: { title: 'fr_title' } },
        },
        raw: '',
      });
    });

    it('should return i18n entry content when structure is I18N_STRUCTURE.MULTIPLE_FILES', async () => {
      const data = {
        'src/content/index.en.md': {
          slug: 'index',
          path: 'src/content/index.en.md',
          data: { title: 'en_title' },
        },
        'src/content/index.de.md': {
          slug: 'index',
          path: 'src/content/index.de.md',
          data: { title: 'de_title' },
        },
        'src/content/index.fr.md': {
          slug: 'index',
          path: 'src/content/index.fr.md',
          data: { title: 'fr_title' },
        },
      };
      const getEntryValue = jest.fn(path =>
        data[path] ? Promise.resolve(data[path]) : Promise.reject('Not found'),
      );

      await expect(
        i18n.getI18nEntry(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FILES, locales, default_locale },
          }),
          ...args,
          getEntryValue,
        ),
      ).resolves.toEqual({
        slug: 'index',
        path: 'src/content/index.md',
        data: { title: 'en_title' },
        i18n: {
          de: { data: { title: 'de_title' } },
          fr: { data: { title: 'fr_title' } },
        },
        raw: '',
      });
    });

    it('should return single entry content when structure is I18N_STRUCTURE.SINGLE_FILE', async () => {
      const data = {
        'src/content/index.md': {
          slug: 'index',
          path: 'src/content/index.md',
          data: {
            en: { title: 'en_title' },
            de: { title: 'de_title' },
            fr: { title: 'fr_title' },
          },
        },
      };
      const getEntryValue = jest.fn(path => Promise.resolve(data[path]));

      await expect(
        i18n.getI18nEntry(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE, locales, default_locale },
          }),
          ...args,
          getEntryValue,
        ),
      ).resolves.toEqual({
        slug: 'index',
        path: 'src/content/index.md',
        data: {
          title: 'en_title',
        },
        i18n: {
          de: { data: { title: 'de_title' } },
          fr: { data: { title: 'fr_title' } },
        },
        raw: '',
      });
    });

    it('should default to empty data object when file is empty and structure is I18N_STRUCTURE.SINGLE_FILE', async () => {
      const data = {
        'src/content/index.md': {
          slug: 'index',
          path: 'src/content/index.md',
          data: {},
        },
      };
      const getEntryValue = jest.fn(path => Promise.resolve(data[path]));

      await expect(
        i18n.getI18nEntry(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE, locales, default_locale },
          }),
          ...args,
          getEntryValue,
        ),
      ).resolves.toEqual({
        slug: 'index',
        path: 'src/content/index.md',
        data: {},
        i18n: {},
        raw: '',
      });
    });
  });

  describe('groupEntries', () => {
    const locales = ['en', 'de', 'fr'];
    const default_locale = 'en';
    const extension = 'md';

    it('should group entries array when structure is I18N_STRUCTURE.MULTIPLE_FOLDERS', () => {
      const entries = [
        {
          slug: 'index',
          path: 'src/content/en/index.md',
          data: { title: 'en_title' },
        },
        {
          slug: 'index',
          path: 'src/content/de/index.md',
          data: { title: 'de_title' },
        },
        {
          slug: 'index',
          path: 'src/content/fr/index.md',
          data: { title: 'fr_title' },
        },
      ];

      expect(
        i18n.groupEntries(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS, locales, default_locale },
          }),
          extension,
          entries,
        ),
      ).toEqual([
        {
          slug: 'index',
          path: 'src/content/index.md',
          data: { title: 'en_title' },
          i18n: { de: { data: { title: 'de_title' } }, fr: { data: { title: 'fr_title' } } },
          raw: '',
        },
      ]);
    });

    it('should group entries array when structure is I18N_STRUCTURE.MULTIPLE_FILES', () => {
      const entries = [
        {
          slug: 'index',
          path: 'src/content/index.en.md',
          data: { title: 'en_title' },
        },
        {
          slug: 'index',
          path: 'src/content/index.de.md',
          data: { title: 'de_title' },
        },
        {
          slug: 'index',
          path: 'src/content/index.fr.md',
          data: { title: 'fr_title' },
        },
      ];

      expect(
        i18n.groupEntries(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FILES, locales, default_locale },
          }),
          extension,
          entries,
        ),
      ).toEqual([
        {
          slug: 'index',
          path: 'src/content/index.md',
          data: { title: 'en_title' },
          i18n: { de: { data: { title: 'de_title' } }, fr: { data: { title: 'fr_title' } } },
          raw: '',
        },
      ]);
    });

    it('should return entries array as is when structure is I18N_STRUCTURE.SINGLE_FILE', () => {
      const entries = [
        {
          slug: 'index',
          path: 'src/content/index.md',
          data: {
            en: { title: 'en_title' },
            de: { title: 'de_title' },
            fr: { title: 'fr_title' },
          },
        },
      ];

      expect(
        i18n.groupEntries(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE, locales, default_locale },
          }),
          extension,
          entries,
        ),
      ).toEqual([
        {
          slug: 'index',
          path: 'src/content/index.md',
          data: {
            title: 'en_title',
          },
          i18n: { de: { data: { title: 'de_title' } }, fr: { data: { title: 'fr_title' } } },
          raw: '',
        },
      ]);
    });
  });

  describe('getI18nDataFiles', () => {
    const locales = ['en', 'de', 'fr'];
    const default_locale = 'en';

    const args = ['md', 'src/content/index.md', 'index'];

    it('should add missing locale files to diff files when structure is MULTIPLE_FOLDERS', () => {
      expect(
        i18n.getI18nDataFiles(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FOLDERS, locales, default_locale },
          }),
          ...args,
          [{ path: 'src/content/fr/index.md', id: 'id', newFile: false }],
        ),
      ).toEqual([
        { path: 'src/content/en/index.md', id: '', newFile: false },
        { path: 'src/content/de/index.md', id: '', newFile: false },
        { path: 'src/content/fr/index.md', id: 'id', newFile: false },
      ]);
    });

    it('should add missing locale files to diff files when structure is MULTIPLE_FILES', () => {
      expect(
        i18n.getI18nDataFiles(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FILES, locales, default_locale },
          }),
          ...args,
          [{ path: 'src/content/index.fr.md', id: 'id', newFile: false }],
        ),
      ).toEqual([
        { path: 'src/content/index.en.md', id: '', newFile: false },
        { path: 'src/content/index.de.md', id: '', newFile: false },
        { path: 'src/content/index.fr.md', id: 'id', newFile: false },
      ]);
    });

    it('should return a single file when structure is SINGLE_FILE', () => {
      expect(
        i18n.getI18nDataFiles(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.SINGLE_FILE, locales, default_locale },
          }),
          ...args,
          [{ path: 'src/content/index.md', id: 'id', newFile: false }],
        ),
      ).toEqual([{ path: 'src/content/index.md', id: 'id', newFile: false }]);
    });
  });

  describe('getI18nBackup', () => {
    it('should return i18n with raw data', () => {
      const locales = ['en', 'de', 'fr'];
      const default_locale = 'en';

      expect(
        i18n.getI18nBackup(
          fromJS({
            i18n: { structure: i18n.I18N_STRUCTURE.MULTIPLE_FILES, locales, default_locale },
          }),
          fromJS({
            data: 'raw_en',
            i18n: {
              de: { data: 'raw_de' },
              fr: { data: 'raw_fr' },
            },
          }),
          e => e.get('data'),
        ),
      ).toEqual({ de: { raw: 'raw_de' }, fr: { raw: 'raw_fr' } });
    });
  });

  describe('formatI18nBackup', () => {
    it('should return i18n with formatted data', () => {
      expect(
        i18n.formatI18nBackup({ de: { raw: 'raw_de' }, fr: { raw: 'raw_fr' } }, raw => ({
          data: raw,
        })),
      ).toEqual({ de: { data: 'raw_de' }, fr: { data: 'raw_fr' } });
    });
  });

  describe('duplicateI18nFields', () => {
    it('should duplicate non nested field when field i18n is DUPLICATE', () => {
      const date = new Date('2020/01/01');
      expect(
        i18n
          .duplicateI18nFields(
            fromJS({ entry: { data: { date } } }),
            fromJS({ name: 'date', i18n: i18n.I18N_FIELD.DUPLICATE }),
            ['en', 'de', 'fr'],
            'en',
          )
          .toJS(),
      ).toEqual({
        entry: {
          data: { date },
          i18n: {
            de: { data: { date } },
            fr: { data: { date } },
          },
        },
      });
    });

    it('should not duplicate field when field i18n is not DUPLICATE', () => {
      const date = new Date('2020/01/01');
      [i18n.I18N_FIELD.TRANSLATE, i18n.I18N_FIELD.TRANSLATE.DUPLICATE].forEach(fieldI18n => {
        expect(
          i18n
            .duplicateI18nFields(
              fromJS({ entry: { data: { date } } }),
              fromJS({ name: 'date', i18n: fieldI18n }),
              ['en', 'de', 'fr'],
              'en',
            )
            .toJS(),
        ).toEqual({
          entry: {
            data: { date },
          },
        });
      });
    });

    it('should duplicate nested field when nested fields i18n is DUPLICATE', () => {
      const date = new Date('2020/01/01');
      const value = fromJS({ title: 'title', date, boolean: true });
      expect(
        i18n
          .duplicateI18nFields(
            fromJS({ entry: { data: { object: value } } }),
            fromJS({
              name: 'object',
              fields: [
                { name: 'string', i18n: i18n.I18N_FIELD.TRANSLATE },
                { name: 'date', i18n: i18n.I18N_FIELD.DUPLICATE },
                { name: 'boolean', i18n: i18n.I18N_FIELD.NONE },
              ],
              i18n: i18n.I18N_FIELD.TRANSLATE,
            }),
            ['en', 'de', 'fr'],
            'en',
          )
          .toJS(),
      ).toEqual({
        entry: {
          data: { object: value.toJS() },
          i18n: {
            de: { data: { object: { date } } },
            fr: { data: { object: { date } } },
          },
        },
      });
    });
  });

  describe('getPreviewEntry', () => {
    it('should set data to i18n data when locale is not default', () => {
      expect(
        i18n
          .getPreviewEntry(
            fromJS({
              data: { title: 'en', body: 'markdown' },
              i18n: { de: { data: { title: 'de' } } },
            }),
            'de',
          )
          .toJS(),
      ).toEqual({
        data: { title: 'de' },
        i18n: { de: { data: { title: 'de' } } },
      });
    });

    it('should not change entry for default locale', () => {
      const entry = fromJS({
        data: { title: 'en', body: 'markdown' },
        i18n: { de: { data: { title: 'de' } } },
      });
      expect(i18n.getPreviewEntry(entry, 'en', 'en')).toBe(entry);
    });
  });
});
