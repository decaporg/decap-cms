/**
 * Semantic UI theme tokens for Decap CMS.
 *
 * Spike for https://github.com/decaporg/decap-cms/issues/1727
 * Defaults match the existing styles.js palette; overrides come from
 * `branding.theme` in config.yml (or CMS.init config).
 */

export const THEME_TOKEN_PREFIX = '--decap';

/**
 * Public config keys → CSS custom property names.
 * Keep this list small for the MVP; expand once maintainers align.
 */
export const THEME_TOKEN_MAP = {
  primary: `${THEME_TOKEN_PREFIX}-color-primary`,
  background: `${THEME_TOKEN_PREFIX}-color-background`,
  foreground: `${THEME_TOKEN_PREFIX}-color-foreground`,
  text: `${THEME_TOKEN_PREFIX}-color-text`,
  textLead: `${THEME_TOKEN_PREFIX}-color-text-lead`,
  activeBackground: `${THEME_TOKEN_PREFIX}-color-active-background`,
  borderRadius: `${THEME_TOKEN_PREFIX}-radius`,
  fontFamily: `${THEME_TOKEN_PREFIX}-font-family`,
  statusDraft: `${THEME_TOKEN_PREFIX}-color-status-draft`,
  statusInReview: `${THEME_TOKEN_PREFIX}-color-status-in-review`,
  statusReady: `${THEME_TOKEN_PREFIX}-color-status-ready`,
};

export const DEFAULT_THEME_VALUES = {
  primary: '#3a69c7',
  background: '#eff0f4',
  foreground: '#fff',
  text: '#798291',
  textLead: '#313d3e',
  activeBackground: '#e8f5fe',
  borderRadius: '5px',
  fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  statusDraft: '#70399f',
  statusInReview: '#754e00',
  statusReady: '#005614',
};

/**
 * Flatten `branding.theme` config (including nested `status`) into token keys.
 */
export function normalizeThemeConfig(themeConfig = {}) {
  if (!themeConfig || typeof themeConfig !== 'object') {
    return {};
  }

  const { status, ...rest } = themeConfig;
  const normalized = { ...rest };

  if (status && typeof status === 'object') {
    if (status.draft) normalized.statusDraft = status.draft;
    if (status.in_review) normalized.statusInReview = status.in_review;
    if (status.ready) normalized.statusReady = status.ready;
  }

  return normalized;
}

/**
 * Build a CSS declaration block for `:root` from defaults + optional overrides.
 */
export function buildThemeCssVars(themeConfig) {
  const overrides = normalizeThemeConfig(themeConfig);
  const values = { ...DEFAULT_THEME_VALUES, ...overrides };

  return Object.entries(THEME_TOKEN_MAP)
    .map(([key, cssVar]) => `${cssVar}: ${values[key]};`)
    .join('\n');
}

/**
 * Helper used by styles.js so semantic colors read tokens with hex fallbacks.
 */
export function themeVar(tokenKey, fallback) {
  const cssVar = THEME_TOKEN_MAP[tokenKey];
  if (!cssVar) {
    return fallback;
  }
  return `var(${cssVar}, ${fallback})`;
}
