import { getPhrases } from '../phrases';

jest.mock('../registry');

describe('defaultPhrases', () => {
  it('should merge en locale with given locale', () => {
    const { getLocale } = require('../registry');

    const locales = {
      en: {
        app: {
          header: {
            content: 'Contents',
            workflow: 'Workflow',
            media: 'Media',
            quickAdd: 'Quick add',
          },
          app: {
            errorHeader: 'Error loading the CMS configuration',
            configErrors: 'Config Errors',
            checkConfigYml: 'Check your config.yml file.',
            loadingConfig: 'Loading configuration...',
            waitingBackend: 'Waiting for backend...',
          },
          notFoundPage: {
            header: 'Not Found',
          },
        },
        collection: {
          sidebar: {
            collections: 'Collections',
            searchAll: 'Search all',
          },
          collectionTop: {
            viewAs: 'View as',
            newButton: 'New %{collectionLabel}',
          },
          entries: {
            loadingEntries: 'Loading Entries',
            cachingEntries: 'Caching Entries',
            longerLoading: 'This might take several minutes',
          },
        },
      },
      de: {
        app: {
          header: {
            content: 'Inhalt',
          },
        },
      },
    };

    getLocale.mockImplementation(locale => locales[locale]);

    expect(getPhrases('de')).toEqual({
      app: {
        header: {
          content: 'Inhalt',
          workflow: 'Workflow',
          media: 'Media',
          quickAdd: 'Quick add',
        },
        app: {
          errorHeader: 'Error loading the CMS configuration',
          configErrors: 'Config Errors',
          checkConfigYml: 'Check your config.yml file.',
          loadingConfig: 'Loading configuration...',
          waitingBackend: 'Waiting for backend...',
        },
        notFoundPage: {
          header: 'Not Found',
        },
      },
      collection: {
        sidebar: {
          collections: 'Collections',
          searchAll: 'Search all',
        },
        collectionTop: {
          viewAs: 'View as',
          newButton: 'New %{collectionLabel}',
        },
        entries: {
          loadingEntries: 'Loading Entries',
          cachingEntries: 'Caching Entries',
          longerLoading: 'This might take several minutes',
        },
      },
    });
  });

  it('should not mutate default phrases', () => {
    const { getLocale } = require('../registry');

    const locales = {
      en: {
        app: {
          header: {
            content: 'Contents',
          },
        },
      },
      de: {
        app: {
          header: {
            content: 'Inhalt',
          },
        },
      },
    };

    getLocale.mockImplementation(locale => locales[locale]);

    const result = getPhrases('de');

    expect(result === locales['en']).toBe(false);
  });
});
