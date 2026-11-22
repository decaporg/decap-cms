import { fromJS } from 'immutable';

import RichtextControl from '../RichtextControl';

describe('RichtextControl change handling', () => {
  function control(value) {
    const onChange = jest.fn();
    const instance = new RichtextControl({ field: fromJS({}), value, onChange });
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

  it('passes on clearing the field', () => {
    const { instance, onChange } = control('Body text\n');
    instance.handleChange('');
    expect(onChange).toHaveBeenCalledWith('');
  });
});
