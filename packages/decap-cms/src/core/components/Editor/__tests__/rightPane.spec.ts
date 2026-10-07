import { afterEach, describe, expect, it } from 'vitest';

import { resolveRightPane, storedPanePreference } from '@/core/components/Editor/rightPane';

describe('editor right pane (decaporg #7994)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('shows the preferred pane when the entry offers it', () => {
    expect(resolveRightPane('preview', { i18n: true, notes: true, preview: true })).toBe('preview');
  });

  it('falls back to the first offered pane in i18n, notes, preview order', () => {
    expect(resolveRightPane('i18n', { i18n: false, notes: true, preview: true })).toBe('notes');
    expect(resolveRightPane(null, { i18n: false, notes: false, preview: true })).toBe('preview');
    expect(resolveRightPane(null, { i18n: false, notes: false, preview: false })).toBeNull();
  });

  it('honours "no pane"', () => {
    expect(resolveRightPane('none', { i18n: true, notes: true, preview: true })).toBeNull();
  });

  it('reads the stored choice, carrying over the old preview/i18n switches', () => {
    expect(storedPanePreference()).toBeNull();

    localStorage.setItem('cms.preview-visible', 'false');
    localStorage.setItem('cms.i18n-visible', 'false');
    expect(storedPanePreference()).toBe('none');

    localStorage.setItem('cms.right-pane', 'notes');
    expect(storedPanePreference()).toBe('notes');

    localStorage.setItem('cms.right-pane', 'bogus');
    expect(storedPanePreference()).toBe('none');
  });
});
