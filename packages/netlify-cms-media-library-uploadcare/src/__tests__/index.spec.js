import { queryHelpers, waitForElement } from 'dom-testing-library';
import uuid from 'uuid/v4';
import uploadcare from '../index';

function generateMockUrl({ count = 1, cdnUrl } = {}) {
  const baseUrl = 'https://ucarecdn.com';
  const url = `${baseUrl}/${uuid()}~${count}/`;
  const result =
    count === 1 ? `${url}nth/0/` : Array.from({ length: count }, (val, idx) => `${url}nth/${idx}/`);
  if (cdnUrl) {
    return { result, cdnUrl: url };
  }
  return result;
}

describe('uploadcare media library', () => {
  let handleInsert;
  let simulateCloseDialog;
  let uploadcareScripts = [];
  const TEST_PUBLIC_KEY = 123;
  const defaultConfig = {
    imagesOnly: false,
    multiple: false,
    previewStep: true,
  };

  beforeEach(() => {
    /**
     * We load the Uploadcare library by injecting script tags to the page
     * head. Initialization waits for the scripts to load, so here we fake it.
     * This also tests that the expected scripts are added to the DOM.
     */
    [/uploadcare\.full\.js$/, /uploadcare\.tab-effects\.js$/].forEach(pattern => {
      waitForElement(() => {
        return queryHelpers.queryByAttribute('src', document, pattern);
      }).then(script => {
        uploadcareScripts.push(script);
        script.onreadystatechange();
      });
    });

    let openDialogCallback;

    /**
     * Mock of the uploadcare widget object itself.
     */
    window.uploadcare = {
      registerTab: jest.fn(),
      openDialog: jest.fn(() => ({
        done: jest.fn(cb => {
          openDialogCallback = cb;
        }),
      })),
      fileFrom: jest.fn((type, url) =>
        Promise.resolve({
          testFileUrl: url,
        }),
      ),
      loadFileGroup: () => ({
        done: cb => cb(),
      }),
    };

    /**
     * Mock to manually call the close dialog registered callback.
     */
    simulateCloseDialog = result =>
      openDialogCallback({
        promise: () => Promise.resolve(result),
      });

    /**
     * Spy to serve as the Netlify CMS insertion handler.
     */
    handleInsert = jest.fn();
  });

  afterEach(() => {
    /**
     * Remove the script elements from the dom after each test.
     */
    const { head } = document;
    uploadcareScripts.forEach(script => head.contains(script) && head.removeChild(script));
    uploadcareScripts = [];
  });

  it('exports an object with expected properties', () => {
    expect(uploadcare).toMatchInlineSnapshot(`
Object {
  "init": [Function],
  "name": "uploadcare",
}
`);
  });

  describe('initialization', () => {
    it('sets global required configuration', async () => {
      const options = {
        config: {
          publicKey: TEST_PUBLIC_KEY,
        },
      };
      await uploadcare.init({ options });
      expect(window.UPLOADCARE_LIVE).toEqual(false);
      expect(window.UPLOADCARE_MANUAL_START).toEqual(true);
      expect(window.UPLOADCARE_PUBLIC_KEY).toEqual(TEST_PUBLIC_KEY);
    });

    it('registers the effects tab', async () => {
      const mockEffectsTab = { mockEffectsTab: true };
      window.uploadcareTabEffects = mockEffectsTab;
      await uploadcare.init();
      expect(window.uploadcare.registerTab).toHaveBeenCalledWith('preview', mockEffectsTab);
    });
  });

  describe('configuration', () => {
    const options = {
      config: {
        foo: 'bar',
      },
    };

    it('has defaults', async () => {
      const integration = await uploadcare.init();
      await integration.show();
      expect(window.uploadcare.openDialog).toHaveBeenCalledWith(null, defaultConfig);
    });

    it('can be defined globally', async () => {
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
      };
      const integration = await uploadcare.init({ options });
      await integration.show();
      expect(window.uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('can be defined per field', async () => {
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
      };
      const integration = await uploadcare.init();
      await integration.show({ config: options.config });
      expect(window.uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });
  });

  describe('show method', () => {
    const options = {
      config: {
        foo: 'bar',
      },
    };

    it('accepts imagesOnly as standalone property', async () => {
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
        imagesOnly: true,
      };
      const integration = await uploadcare.init();
      await integration.show({ config: options.config, imagesOnly: true });
      expect(window.uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('allows multiple selection if allowMultiple is not false', async () => {
      options.config.multiple = true;
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
        multiple: true,
      };
      const integration = await uploadcare.init({ options });
      await integration.show({ config: options.config });
      expect(window.uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('disallows multiple selection if allowMultiple is false', async () => {
      options.config.multiple = true;
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
        multiple: false,
      };
      const integration = await uploadcare.init({ options });
      await integration.show({ config: options.config, allowMultiple: false });
      expect(window.uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('passes selected image url to handleInsert', async () => {
      const url = generateMockUrl();
      const mockResult = { cdnUrl: url };
      const integration = await uploadcare.init({ handleInsert });
      await integration.show();
      await simulateCloseDialog(mockResult);
      expect(handleInsert).toHaveBeenCalledWith(url);
    });

    it('passes multiple selected image urls to handleInsert', async () => {
      options.config.multiple = true;
      const { result, cdnUrl } = generateMockUrl({ count: 3, cdnUrl: true });
      const mockDialogCloseResult = { cdnUrl, count: 3 };
      const integration = await uploadcare.init({ options, handleInsert });
      await integration.show();
      await simulateCloseDialog(mockDialogCloseResult);
      expect(handleInsert).toHaveBeenCalledWith(result);
    });
  });

  describe('enableStandalone method', () => {
    it('returns false', async () => {
      const integration = await uploadcare.init();
      expect(integration.enableStandalone()).toEqual(false);
    });
  });
});
