import toggleLink from '../events/toggleLink';
import getActiveLink from '../selectors/getActiveLink';
import unwrapLink from '../transforms/unwrapLink';
import wrapLink from '../transforms/wrapLink';

jest.mock('../selectors/getActiveLink');
jest.mock('../transforms/unwrapLink');
jest.mock('../transforms/wrapLink');

describe('toggleLink', () => {
  const editor = {};

  function t(key) {
    return key;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    getActiveLink.mockReturnValue(undefined);
    window.prompt = jest.fn();
    window.alert = jest.fn();
  });

  it('should wrap the selection in a valid URL', () => {
    window.prompt.mockReturnValue('https://example.com/a.pdf');

    toggleLink(editor, t);

    expect(wrapLink).toHaveBeenCalledWith(editor, 'https://example.com/a.pdf');
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should trim surrounding whitespace before wrapping', () => {
    window.prompt.mockReturnValue('  https://example.com  ');

    toggleLink(editor, t);

    expect(wrapLink).toHaveBeenCalledWith(editor, 'https://example.com');
  });

  it('should reject prose pasted into the prompt and leave the document alone', () => {
    window.prompt.mockReturnValue(
      'Pobuda se uvrsti na glasovanje participativnega proračuna v prilagojeni obliki.',
    );

    toggleLink(editor, t);

    expect(wrapLink).not.toHaveBeenCalled();
    expect(unwrapLink).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('editor.editorWidgets.markdown.linkPromptInvalid');
  });

  it('should reject a dangerous protocol', () => {
    window.prompt.mockReturnValue('javascript:alert(1)');

    toggleLink(editor, t);

    expect(wrapLink).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should do nothing when the prompt is cancelled', () => {
    window.prompt.mockReturnValue(null);

    toggleLink(editor, t);

    expect(wrapLink).not.toHaveBeenCalled();
    expect(unwrapLink).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should unwrap an existing link when the URL is cleared', () => {
    getActiveLink.mockReturnValue([{ data: { url: 'https://example.com' } }]);
    window.prompt.mockReturnValue('   ');

    toggleLink(editor, t);

    expect(unwrapLink).toHaveBeenCalledWith(editor);
    expect(wrapLink).not.toHaveBeenCalled();
  });
});
