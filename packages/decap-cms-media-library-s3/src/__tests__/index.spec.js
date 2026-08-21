import s3 from '../index';

const mockRender = jest.fn();
const mockUnmount = jest.fn();

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: mockRender,
    unmount: mockUnmount,
  })),
}));

jest.mock('../components/S3Widget', () => ({
  __esModule: true,
  default: () => null,
}));

function getRenderedWidgetProps() {
  expect(mockRender).toHaveBeenCalledTimes(1);
  const renderedElement = mockRender.mock.calls[0][0];
  return renderedElement.props;
}

describe('s3 exports', () => {
  it('exports an object with expected properties', () => {
    expect(s3).toMatchInlineSnapshot(`
Object {
  "init": [Function],
  "name": "s3",
}
`);
  });
});

describe('s3 media library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('configuration', () => {
    it('throws when public_url_prefix is missing', async () => {
      await expect(s3.init()).rejects.toThrow(
        'public_url_prefix is required in media_library config',
      );
    });
  });

  describe('show method', () => {
    it('renders widget with default single-select behavior', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show();

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(false);
      expect(props.imagesOnly).toBe(false);
      expect(props.config).toEqual({ public_url_prefix: 'https://cdn.example.test' });
    });

    it('disables multi-select by default even when allowMultiple is true', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show({ allowMultiple: true });

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(false);
    });

    it('enables multi-select only when multiple:true is configured', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show({ allowMultiple: true, config: { multiple: true } });

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(true);
    });

    it('keeps multi-select disabled when field disallows it', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test', multiple: true } },
      });

      integration.show({ allowMultiple: false, config: { multiple: true } });

      const props = getRenderedWidgetProps();
      expect(props.allowMultiple).toBe(false);
    });

    it('does not re-render when already open', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show();
      integration.show();

      expect(mockRender).toHaveBeenCalledTimes(1);
    });
  });

  describe('hide method', () => {
    it('unmounts widget and clears container', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      integration.show();
      expect(document.body.children).toHaveLength(1);

      integration.hide();

      expect(mockUnmount).toHaveBeenCalledTimes(1);
      expect(document.body.children).toHaveLength(0);
    });
  });

  describe('enableStandalone method', () => {
    it('returns true', async () => {
      const integration = await s3.init({
        options: { config: { public_url_prefix: 'https://cdn.example.test' } },
      });

      expect(integration.enableStandalone()).toBe(true);
    });
  });
});
