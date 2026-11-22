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

describe('MarkdownControl change handling', () => {
  function control(value) {
    const onChange = jest.fn();
    const instance = new MarkdownControl({
      field: fromJS({}),
      editorControl: () => null,
      getEditorComponents: () => Map(),
      value,
      onChange,
    });
    return { instance, onChange };
  }

  it('ignores a change that only drops the trailing newline of the stored value', () => {
    const { instance, onChange } = control('Body text\n');
    instance.handleChange('Body text');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the trailing newline of the stored value on a content change', () => {
    const { instance, onChange } = control('Body text\n');
    instance.handleChange('Body text, edited');
    expect(onChange).toHaveBeenCalledWith('Body text, edited\n');
  });

  it('gives back the saved value when an edit is undone', () => {
    const { instance, onChange } = control('Body text, edited\n');
    instance.handleChange('Body text');
    expect(onChange).toHaveBeenCalledWith('Body text\n');
  });

  it('passes on trailing whitespace typed in the raw editor', () => {
    const { instance, onChange } = control('Body text');
    instance.handleChange('Body text\n\n');
    expect(onChange).toHaveBeenCalledWith('Body text\n\n');
  });

  it('passes on the first content typed into an empty field', () => {
    const { instance, onChange } = control(undefined);
    instance.handleChange('Hello');
    expect(onChange).toHaveBeenCalledWith('Hello');
  });

  it('passes on clearing the field', () => {
    const { instance, onChange } = control('Body text\n');
    instance.handleChange('');
    expect(onChange).toHaveBeenCalledWith('');
  });
});
