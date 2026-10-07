/**
 * The editor shows one pane beside the fields: the second locale, the notes
 * (decaporg #7563/#7994) or the preview. The editor's choice is remembered;
 * when this entry can't offer it, the first pane it can offer is shown, in
 * this order.
 */
const PREVIEW_VISIBLE = 'cms.preview-visible';
const I18N_VISIBLE = 'cms.i18n-visible';
export const RIGHT_PANE = 'cms.right-pane';

export type RightPane = 'i18n' | 'notes' | 'preview';
const PANE_ORDER: RightPane[] = ['i18n', 'notes', 'preview'];
export const NO_PANE = 'none';
export type PanePreference = RightPane | typeof NO_PANE;

function isPanePreference(value: string | null): value is PanePreference {
  return value === NO_PANE || PANE_ORDER.includes(value as RightPane);
}

/**
 * The stored pane choice. Before `cms.right-pane` existed, the i18n and
 * preview panes had separate on/off switches; both switched off carries over
 * as "no pane".
 */
export function storedPanePreference(): PanePreference | null {
  const stored = localStorage.getItem(RIGHT_PANE);
  if (isPanePreference(stored)) {
    return stored;
  }
  if (localStorage.getItem(PREVIEW_VISIBLE) === 'false' && localStorage.getItem(I18N_VISIBLE) === 'false') {
    return NO_PANE;
  }
  return null;
}

/**
 * The pane to show: the preferred one when this entry offers it, otherwise
 * the first one it does offer; `null` for none.
 */
export function resolveRightPane(
  preferred: PanePreference | null,
  available: Record<RightPane, boolean>,
): RightPane | null {
  if (preferred === NO_PANE) {
    return null;
  }
  if (preferred && available[preferred]) {
    return preferred;
  }
  return PANE_ORDER.find(pane => available[pane]) ?? null;
}
