import { fromJS, Map } from 'immutable';

import MarkdownControl from '../index';

function initialMode(field, props = {}) {
  const control = new MarkdownControl({
    field: fromJS(field),
    editorControl: () => null,
    getEditorComponents: () => Map(),
    ...props,
  });
  return control.state.mode;
}

describe('MarkdownControl initial mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in rich text by default', () => {
    expect(initialMode({})).toBe('rich_text');
  });

  it('starts in the first mode listed in `modes`', () => {
    expect(initialMode({ modes: ['raw', 'rich_text'] })).toBe('raw');
  });

  it('prefers the mode the user picked last, when the field allows it', () => {
    localStorage.setItem('cms.md-mode', 'rich_text');
    expect(initialMode({ modes: ['raw', 'rich_text'] })).toBe('rich_text');
  });

  it('ignores a saved mode the field does not allow', () => {
    localStorage.setItem('cms.md-mode', 'rich_text');
    expect(initialMode({ modes: ['raw'] })).toBe('raw');
  });
});
