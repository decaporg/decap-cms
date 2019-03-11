import { queryHelpers, waitForElement } from 'dom-testing-library';
import cloudinary from '../index';

describe('cloudinary media library', () => {
  let mediaLibrary;
  let cloudinaryScript;
  let cloudinaryConfig;
  let cloudinaryInsertHandler;

  beforeEach(() => {
    /**
     * Mock of the Cloudinary library itself, which is otherwise created by
     * their script (which isn't actually run during testing).
     */
    window.cloudinary = {
      createMediaLibrary: (config, { insertHandler }) => {
        cloudinaryConfig = config;
        cloudinaryInsertHandler = insertHandler;
        return mediaLibrary;
      },
    };

    /**
     * Mock of the object returned by the Cloudinary createMediaLibrary method.
     */
    mediaLibrary = {
      show: jest.fn(),
      hide: jest.fn(),
    };

    /**
     * We load the Cloudinary library by injecting a script tag to the page
     * head. Initialization waits for the script to load, so here we fake it.
     * This also tests that the expected script is added to the DOM.
     */
    waitForElement(() => {
      const url = 'https://media-library.cloudinary.com/global/all.js';
      return queryHelpers.queryByAttribute('src', document, url);
    }).then(script => {
      cloudinaryScript = script;
      script.onreadystatechange();
    });
  });

  afterEach(() => {
    /**
     * Remove the script element from the dom after each test.
     */
    if (cloudinaryScript) {
      document.head.removeChild(cloudinaryScript);
    }
  });

  it('exports an object with expected properties', () => {
    expect(cloudinary).toMatchInlineSnapshot(`
Object {
  "init": [Function],
  "name": "cloudinary",
}
`);
  });

  describe('configuration', () => {
    const defaultCloudinaryConfig = {
      button_class: undefined,
      inline_container: undefined,
      insert_transformation: false,
      z_index: '99999',
      multiple: false,
    };

    it('has defaults', async () => {
      await cloudinary.init();
      expect(cloudinaryConfig).toEqual(defaultCloudinaryConfig);
    });

    it('does not allow enforced values to be overridden', async () => {
      const options = {
        config: {
          button_class: 'foo',
          inline_container: 'foo',
          insert_transformation: 'foo',
          z_index: 0,
        },
      };
      await cloudinary.init({ options });
      expect(cloudinaryConfig).toEqual(defaultCloudinaryConfig);
    });

    it('allows non-enforced defaults to be overridden', async () => {
      const options = {
        config: {
          multiple: true,
        },
      };
      await cloudinary.init({ options });
      expect(cloudinaryConfig).toEqual({ ...defaultCloudinaryConfig, ...options.config });
    });

    it('allows unknown values', async () => {
      const options = {
        config: {
          foo: 'bar',
        },
      };
      await cloudinary.init({ options });
      expect(cloudinaryConfig).toEqual({ ...defaultCloudinaryConfig, ...options.config });
    });
  });

  describe('insertHandler', () => {
    let handleInsert;
    const asset = {
      url: 'http://foo.bar/image.jpg',
      secure_url: 'https://foo.bar/image.jpg',
      public_id: 'image',
      format: 'jpg',
    };
    const assetWithDerived = {
      ...asset,
      derived: [
        {
          secure_url: 'https://derived.foo.bar/image.jpg',
          url: 'http://derived.foo.bar/image.jpg',
        },
      ],
    };

    beforeEach(() => {
      handleInsert = jest.fn();
    });

    it('calls insert function with single asset', async () => {
      await cloudinary.init({ handleInsert });
      cloudinaryInsertHandler({ assets: [asset] });
      expect(handleInsert).toHaveBeenCalledWith(expect.any(String));
    });

    it('calls insert function with multiple assets', async () => {
      const options = {
        config: {
          multiple: true,
        },
      };
      await cloudinary.init({ options, handleInsert });
      cloudinaryInsertHandler({ assets: [asset, asset] });
      expect(handleInsert).toHaveBeenCalledWith(expect.any(Array));
    });

    it('calls insert function with secure url', async () => {
      await cloudinary.init({ handleInsert });
      cloudinaryInsertHandler({ assets: [asset] });
      expect(handleInsert).toHaveBeenCalledWith(asset.secure_url);
    });

    it('calls insert function with insecure url', async () => {
      const options = {
        use_secure_url: false,
      };
      await cloudinary.init({ options, handleInsert });
      cloudinaryInsertHandler({ assets: [asset] });
      expect(handleInsert).toHaveBeenCalledWith(asset.url);
    });

    it('supports derived assets', async () => {
      await cloudinary.init({ handleInsert });
      cloudinaryInsertHandler({ assets: [assetWithDerived] });
      expect(handleInsert).toHaveBeenCalledWith(assetWithDerived.derived[0].secure_url);
    });

    it('ignores derived assets when use_transformations is false', async () => {
      const options = {
        use_transformations: false,
      };
      await cloudinary.init({ options, handleInsert });
      cloudinaryInsertHandler({ assets: [assetWithDerived] });
      expect(handleInsert).toHaveBeenCalledWith(assetWithDerived.secure_url);
    });

    it('supports outputting filename only', async () => {
      const options = {
        output_filename_only: true,
      };
      await cloudinary.init({ options, handleInsert });
      cloudinaryInsertHandler({ assets: [asset] });
      expect(handleInsert.mock.calls[0][0]).toMatchInlineSnapshot(`"image.jpg"`);
    });
  });

  describe('show method', () => {
    const defaultOptions = {
      config: {
        multiple: false,
      },
    };

    it('calls cloudinary instance show method with default options', async () => {
      const integration = await cloudinary.init();
      integration.show();
      expect(mediaLibrary.show).toHaveBeenCalledWith(defaultOptions.config);
    });

    it('accepts unknown configuration keys', async () => {
      const showOptions = {
        config: {
          ...defaultOptions.config,
          foo: 'bar',
        },
      };
      const integration = await cloudinary.init();
      integration.show(showOptions);
      expect(mediaLibrary.show).toHaveBeenCalledWith(showOptions.config);
    });

    it('receives global configuration for behavior only', async () => {
      const behaviorOptions = {
        default_transformations: [{ foo: 'bar' }],
        max_files: 2,
        multiple: true,
      };
      const nonBehaviorOptions = {
        api_key: 123,
      };
      const options = {
        config: {
          ...behaviorOptions,
          ...nonBehaviorOptions,
        },
      };
      const expectedOptions = {
        config: behaviorOptions,
      };
      const integration = await cloudinary.init({ options });
      integration.show();
      expect(mediaLibrary.show).toHaveBeenCalledWith(expectedOptions.config);
    });

    it('allows global/default configuration to be overridden', async () => {
      const showOptions = {
        config: {
          multiple: true,
        },
      };
      const integration = await cloudinary.init();
      integration.show(showOptions);
      expect(mediaLibrary.show).toHaveBeenCalledWith(showOptions.config);
    });

    it('enforces multiple: false if allowMultiple is false', async () => {
      const options = {
        config: {
          multiple: true,
        },
      };
      const showOptions = {
        config: {
          multiple: true,
        },
        allowMultiple: false,
      };
      const expectedOptions = {
        config: {
          multiple: false,
        },
      };
      const integration = await cloudinary.init(options);
      integration.show(showOptions);
      expect(mediaLibrary.show).toHaveBeenCalledWith(expectedOptions.config);
    });
  });

  describe('hide method', () => {
    it('calls cloudinary instance hide method', async () => {
      const integration = await cloudinary.init();
      integration.hide();
      expect(mediaLibrary.hide).toHaveBeenCalled();
    });
  });

  describe('enableStandalone method', () => {
    it('returns true', async () => {
      const integration = await cloudinary.init();
      expect(integration.enableStandalone()).toEqual(true);
    });
  });
});
