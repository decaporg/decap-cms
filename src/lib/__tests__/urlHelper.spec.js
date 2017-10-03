import { sanitizeIRI } from '../urlHelper';

describe('sanitizeIRI', () => {
  // `sanitizeIRI` tests from RFC 3987
  it('should keep valid URI chars (letters digits _ - . ~)', () => {
    expect(
      sanitizeIRI("This, that-one_or.the~other 123!")
    ).toEqual('Thisthat-one_or.the~other123');
  });
  
  it('should not remove accents', () => {
    expect(
      sanitizeIRI("ěščřžý")
    ).toEqual('ěščřžý');
  });
  
  it('should keep valid non-latin chars (ucschars in RFC 3987)', () => {
    expect(
      sanitizeIRI("日本語のタイトル")
    ).toEqual('日本語のタイトル');
  });

  it('should not normalize Unicode strings', () => {
    expect(
      sanitizeIRI('\u017F\u0323\u0307')
    ).toEqual('\u017F\u0323\u0307');
    expect(
      sanitizeIRI('\u017F\u0323\u0307')
    ).not.toEqual('\u1E9B\u0323');
  });
  
  it('should allow a custom replacement character', () => {
    expect(
      sanitizeIRI("duck\\goose.elephant", { replacement: '-' })
    ).toEqual('duck-goose.elephant');
  });
  
  it('should not allow an improper replacement character', () => {
    expect(
      sanitizeIRI("I! like! dollars!", { replacement: '$' })
    ).not.toEqual('I$$like$$dollars$');
    expect(
      sanitizeIRI("I! like! dollars!", { replacement: '$' })
    ).toThrow();
  });
  
  it('should not actually URI-encode the characters', () => {
    expect(
      sanitizeIRI("🎉")
    ).toEqual('🎉');
    expect(
      sanitizeIRI("🎉")
    ).not.toEqual("%F0%9F%8E%89");
  });
});
