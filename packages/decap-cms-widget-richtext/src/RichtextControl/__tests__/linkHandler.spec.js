import { unwrapLink, upsertLink } from '@platejs/link';

import { handleLinkClick } from '../linkHandler';
import isValidLinkUrl from '../isValidLinkUrl';

jest.mock('@platejs/link', () => ({
  unwrapLink: jest.fn(),
  upsertLink: jest.fn(),
}));

describe('isValidLinkUrl', () => {
  it('should accept absolute, relative and non-http destinations', () => {
    expect(isValidLinkUrl('https://example.com/a/b?c=d#e')).toBe(true);
    expect(isValidLinkUrl('//example.com')).toBe(true);
    expect(isValidLinkUrl('/about')).toBe(true);
    expect(isValidLinkUrl('../sibling.md')).toBe(true);
    expect(isValidLinkUrl('#anchor')).toBe(true);
    expect(isValidLinkUrl('mailto:someone@example.com')).toBe(true);
    expect(isValidLinkUrl('tel:+38634265800')).toBe(true);
    expect(isValidLinkUrl('/files/my%20file.pdf')).toBe(true);
  });

  it('should reject prose pasted into the URL prompt', () => {
    expect(isValidLinkUrl('Pobuda se uvrsti na glasovanje participativnega proračuna.')).toBe(
      false,
    );
    expect(isValidLinkUrl('https://example.com/a b')).toBe(false);
    expect(isValidLinkUrl('has\ttab')).toBe(false);
  });

  it('should reject empty, blank and non-string input', () => {
    expect(isValidLinkUrl('')).toBe(false);
    expect(isValidLinkUrl('   ')).toBe(false);
    expect(isValidLinkUrl(undefined)).toBe(false);
    expect(isValidLinkUrl(null)).toBe(false);
  });

  // Nothing else on this path rejects these: upsertLink is called with
  // `skipValidation`, so Plate's own check never runs.
  it('should reject a scheme that executes on click', () => {
    expect(isValidLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isValidLinkUrl('JavaScript:alert(1)')).toBe(false);
    expect(isValidLinkUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidLinkUrl('file:///etc/passwd')).toBe(false);
    expect(isValidLinkUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
  });
});

describe('handleLinkClick', () => {
  const editor = {};

  function t(key) {
    return key;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    window.prompt = jest.fn();
    window.alert = jest.fn();
  });

  it('should insert a valid URL', () => {
    window.prompt.mockReturnValue('https://example.com/a.pdf');

    handleLinkClick({ editor, t });

    expect(upsertLink).toHaveBeenCalledWith(editor, {
      url: 'https://example.com/a.pdf',
      skipValidation: true,
    });
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('should trim surrounding whitespace before inserting', () => {
    window.prompt.mockReturnValue('  https://example.com  ');

    handleLinkClick({ editor, t });

    expect(upsertLink).toHaveBeenCalledWith(editor, {
      url: 'https://example.com',
      skipValidation: true,
    });
  });

  it('should reject prose pasted into the prompt and leave the document alone', () => {
    window.prompt.mockReturnValue(
      'Pobuda se uvrsti na glasovanje participativnega proračuna v prilagojeni obliki.',
    );

    handleLinkClick({ editor, t });

    expect(upsertLink).not.toHaveBeenCalled();
    expect(unwrapLink).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('editor.editorWidgets.markdown.linkPromptInvalid');
  });

  it('should reject a dangerous protocol', () => {
    window.prompt.mockReturnValue('javascript:alert(1)');

    handleLinkClick({ editor, t });

    expect(upsertLink).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should do nothing when the prompt is cancelled', () => {
    window.prompt.mockReturnValue(null);

    handleLinkClick({ editor, t });

    expect(upsertLink).not.toHaveBeenCalled();
    expect(unwrapLink).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  // Previously a blank string fell through to upsertLink and inserted a link
  // whose destination was a space.
  it('should unwrap an existing link when the URL is cleared or blanked', () => {
    window.prompt.mockReturnValue('   ');

    handleLinkClick({ editor, t });

    expect(unwrapLink).toHaveBeenCalledWith(editor);
    expect(upsertLink).not.toHaveBeenCalled();
  });
});
