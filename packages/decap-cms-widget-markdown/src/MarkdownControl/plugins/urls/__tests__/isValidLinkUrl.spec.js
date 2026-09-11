import isValidLinkUrl from '../isValidLinkUrl';

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
    expect(isValidLinkUrl('Pobuda se uvrsti na glasovanje participativnega proračuna.')).toBe(false);
    expect(isValidLinkUrl('https://example.com/a b')).toBe(false);
    expect(isValidLinkUrl('two words')).toBe(false);
    expect(isValidLinkUrl('has\ttab')).toBe(false);
    expect(isValidLinkUrl('has\nnewline')).toBe(false);
  });

  it('should reject empty and non-string input', () => {
    expect(isValidLinkUrl('')).toBe(false);
    expect(isValidLinkUrl(undefined)).toBe(false);
    expect(isValidLinkUrl(null)).toBe(false);
  });

  it('should reject destinations with a dangerous protocol', () => {
    expect(isValidLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isValidLinkUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidLinkUrl('file:///etc/passwd')).toBe(false);
    expect(isValidLinkUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
  });
});
