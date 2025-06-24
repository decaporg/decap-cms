import { v4 as uuid } from 'uuid';
import uploadcare from 'uploadcare-widget';
import uploadcareTabEffects from 'uploadcare-widget-tab-effects';

import uploadcareMediaLibrary from '../index';

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

let openDialogCallback;

/**
 * Mock of the uploadcare widget object itself.
 */
jest.mock('uploadcare-widget', () => ({
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
}));

describe('uploadcare media library', () => {
  let handleInsert;
  let simulateCloseDialog;
  const TEST_PUBLIC_KEY = 123;
  const defaultConfig = {
    imagesOnly: false,
    multiple: false,
    previewStep: true,
    integration: 'DecapCMS-Uploadcare-MediaLibrary',
  };

  beforeEach(() => {
    /**
     * Mock to manually call the close dialog registered callback.
     */
    simulateCloseDialog = (result, files) =>
      openDialogCallback({
        promise: () => Promise.resolve(result),
        ...(files ? { files: () => files.map(file => Promise.resolve(file)) } : {}),
      });

    /**
     * Spy to serve as the Decap CMS insertion handler.
     */
    handleInsert = jest.fn();
  });

  it('exports an object with expected properties', () => {
    expect(uploadcareMediaLibrary).toMatchInlineSnapshot(`
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
      await uploadcareMediaLibrary.init({ options });
      expect(window.UPLOADCARE_LIVE).toEqual(false);
      expect(window.UPLOADCARE_MANUAL_START).toEqual(true);
      expect(window.UPLOADCARE_PUBLIC_KEY).toEqual(TEST_PUBLIC_KEY);
    });

    it('registers the effects tab', async () => {
      await uploadcareMediaLibrary.init();
      expect(uploadcare.registerTab).toHaveBeenCalledWith('preview', uploadcareTabEffects);
    });
  });

  describe('widget configuration', () => {
    const options = {
      config: {
        foo: 'bar',
      },
    };

    it('has defaults', async () => {
      const integration = await uploadcareMediaLibrary.init();
      await integration.show();
      expect(uploadcare.openDialog).toHaveBeenCalledWith(null, defaultConfig);
    });

    it('can be defined globally', async () => {
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
      };
      const integration = await uploadcareMediaLibrary.init({ options });
      await integration.show();
      expect(uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('can be defined per field', async () => {
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
      };
      const integration = await uploadcareMediaLibrary.init();
      await integration.show({ config: options.config });
      expect(uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
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
      const integration = await uploadcareMediaLibrary.init();
      await integration.show({ config: options.config, imagesOnly: true });
      expect(uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('allows multiple selection if allowMultiple is not false', async () => {
      options.config.multiple = true;
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
        multiple: true,
      };
      const integration = await uploadcareMediaLibrary.init({ options });
      await integration.show({ config: options.config });
      expect(uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('disallows multiple selection if allowMultiple is false', async () => {
      options.config.multiple = true;
      const expectedConfig = {
        ...defaultConfig,
        ...options.config,
        multiple: false,
      };
      const integration = await uploadcareMediaLibrary.init({ options });
      await integration.show({ config: options.config, allowMultiple: false });
      expect(uploadcare.openDialog).toHaveBeenCalledWith(null, expectedConfig);
    });

    it('passes selected image url to handleInsert', async () => {
      const url = generateMockUrl();
      const mockResult = { cdnUrl: url };
      const integration = await uploadcareMediaLibrary.init({ handleInsert });
      await integration.show();
      await simulateCloseDialog(mockResult);
      expect(handleInsert).toHaveBeenCalledWith(url);
    });

    it('passes multiple selected image urls to handleInsert', async () => {
      options.config.multiple = true;
      const { result, cdnUrl } = generateMockUrl({ count: 3, cdnUrl: true });
      const mockDialogCloseResult = { cdnUrl, count: 3 };
      const mockDialogCloseFiles = result.map((cdnUrl, idx) => ({
        cdnUrl,
        isImage: true,
        name: `test${idx}.png`,
      }));
      const integration = await uploadcareMediaLibrary.init({ options, handleInsert });
      await integration.show();
      await simulateCloseDialog(mockDialogCloseResult, mockDialogCloseFiles);
      expect(handleInsert).toHaveBeenCalledWith(result);
    });
  });

  describe('settings', () => {
    describe('defaultOperations', () => {
      it('should append specified string to the url', async () => {
        const options = {
          config: {
            publicKey: TEST_PUBLIC_KEY,
          },
          settings: {
            defaultOperations: '/preview/',
          },
        };
        const url = generateMockUrl();
        const mockResult = { cdnUrl: url, isImage: true };
        const integration = await uploadcareMediaLibrary.init({
          options,
          handleInsert,
        });
        await integration.show();
        await simulateCloseDialog(mockResult);
        expect(handleInsert).toHaveBeenCalledWith(url + '-/preview/');
      });

      it('should work along with `autoFilename` setting enabled', async () => {
        const options = {
          config: {
            publicKey: TEST_PUBLIC_KEY,
          },
          settings: {
            autoFilename: true,
            defaultOperations: '/preview/',
          },
        };
        const url = generateMockUrl();
        const mockResult = { cdnUrl: url, isImage: true, name: 'test.png' };
        const integration = await uploadcareMediaLibrary.init({
          options,
          handleInsert,
        });
        await integration.show();
        await simulateCloseDialog(mockResult);
        expect(handleInsert).toHaveBeenCalledWith(url + '-/preview/test.png');
      });

      it('should overwrite filename with `autoFilename` setting enabled', async () => {
        const options = {
          config: {
            publicKey: TEST_PUBLIC_KEY,
          },
          settings: {
            autoFilename: true,
            defaultOperations: '/preview/another_name.png',
          },
        };
        const url = generateMockUrl();
        const mockResult = { cdnUrl: url, isImage: true, name: 'test.png' };
        const integration = await uploadcareMediaLibrary.init({
          options,
          handleInsert,
        });
        await integration.show();
        await simulateCloseDialog(mockResult);
        expect(handleInsert).toHaveBeenCalledWith(url + '-/preview/another_name.png');
      });
    });

    describe('autoFilename', () => {
      it('should append filename to the url', async () => {
        const options = {
          config: {
            publicKey: TEST_PUBLIC_KEY,
          },
          settings: {
            autoFilename: true,
          },
        };
        const url = generateMockUrl();
        const mockResult = { cdnUrl: url, isImage: true, name: 'test.png' };
        const integration = await uploadcareMediaLibrary.init({
          options,
          handleInsert,
        });
        await integration.show();
        await simulateCloseDialog(mockResult);
        expect(handleInsert).toHaveBeenCalledWith(url + 'test.png');
      });
    });
  });

  describe('enableStandalone method', () => {
    it('returns false', async () => {
      const integration = await uploadcareMediaLibrary.init();
      expect(integration.enableStandalone()).toEqual(false);
    });
  });
});
