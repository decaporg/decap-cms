import { resolveRightPane, storedPanePreference } from '../EditorInterface';

const ALL = { i18n: true, notes: true, preview: true };

describe('editor right pane selection', () => {
  describe('resolveRightPane', () => {
    it('shows the pane the editor asked for', () => {
      expect(resolveRightPane('notes', ALL)).toBe('notes');
      expect(resolveRightPane('preview', ALL)).toBe('preview');
      expect(resolveRightPane('i18n', ALL)).toBe('i18n');
    });

    it('shows nothing once every pane is closed', () => {
      expect(resolveRightPane('none', ALL)).toBeNull();
    });

    /**
     * The bug this whole model exists to prevent: as three booleans all three
     * defaulted to true, i18n won by precedence, and pressing Notes lit its
     * toggle while the slot kept showing the second locale. One value cannot
     * represent "notes is on but i18n is showing".
     */
    it('never reports a pane other than the one showing', () => {
      const showing = resolveRightPane('notes', ALL);

      expect(showing).toBe('notes');
      expect(showing === 'i18n').toBe(false);
    });

    it('falls through when this entry cannot offer the chosen pane', () => {
      // Notes need a saved entry, so a new one offers preview instead of
      // leaving the slot empty.
      expect(resolveRightPane('notes', { i18n: false, notes: false, preview: true })).toBe(
        'preview',
      );
    });

    it('keeps the preference for entries that do offer it', () => {
      // Falling through is display-only: the stored choice is untouched, so
      // returning to an entry with notes shows notes again.
      const preference = 'notes';

      expect(resolveRightPane(preference, { i18n: true, notes: false, preview: true })).toBe(
        'i18n',
      );
      expect(resolveRightPane(preference, ALL)).toBe('notes');
    });

    it('shows nothing when the entry offers no pane at all', () => {
      expect(resolveRightPane('notes', { i18n: false, notes: false, preview: false })).toBeNull();
    });
  });

  describe('storedPanePreference', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('reads the recorded preference', () => {
      localStorage.setItem('cms.right-pane', 'notes');

      expect(storedPanePreference()).toBe('notes');
    });

    it('defaults to the first pane, matching the old precedence', () => {
      expect(storedPanePreference()).toBe('i18n');
    });
  });
});
