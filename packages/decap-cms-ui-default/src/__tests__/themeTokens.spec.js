import {
  DEFAULT_THEME_VALUES,
  THEME_TOKEN_MAP,
  buildThemeCssVars,
  normalizeThemeConfig,
  themeVar,
} from '../themeTokens';

describe('themeTokens', () => {
  describe('normalizeThemeConfig', () => {
    it('flattens nested status keys', () => {
      expect(
        normalizeThemeConfig({
          primary: '#112f4e',
          status: {
            draft: '#111111',
            in_review: '#222222',
            ready: '#333333',
          },
        }),
      ).toEqual({
        primary: '#112f4e',
        statusDraft: '#111111',
        statusInReview: '#222222',
        statusReady: '#333333',
      });
    });

    it('returns empty object for invalid input', () => {
      expect(normalizeThemeConfig(null)).toEqual({});
      expect(normalizeThemeConfig(undefined)).toEqual({});
    });
  });

  describe('buildThemeCssVars', () => {
    it('includes default token declarations', () => {
      const css = buildThemeCssVars();
      expect(css).toContain(`${THEME_TOKEN_MAP.primary}: ${DEFAULT_THEME_VALUES.primary};`);
      expect(css).toContain(`${THEME_TOKEN_MAP.background}: ${DEFAULT_THEME_VALUES.background};`);
    });

    it('applies overrides from branding.theme shape', () => {
      const css = buildThemeCssVars({
        primary: '#112f4e',
        status: { draft: '#abcdef' },
      });
      expect(css).toContain(`${THEME_TOKEN_MAP.primary}: #112f4e;`);
      expect(css).toContain(`${THEME_TOKEN_MAP.statusDraft}: #abcdef;`);
      expect(css).toContain(`${THEME_TOKEN_MAP.text}: ${DEFAULT_THEME_VALUES.text};`);
    });
  });

  describe('themeVar', () => {
    it('returns a CSS custom property with fallback', () => {
      expect(themeVar('primary', '#3a69c7')).toBe(
        `var(${THEME_TOKEN_MAP.primary}, #3a69c7)`,
      );
    });
  });
});
