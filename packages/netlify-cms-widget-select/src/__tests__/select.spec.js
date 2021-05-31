import React from 'react';
import { fromJS, List } from 'immutable';
import { render, fireEvent } from '@testing-library/react';

import { NetlifyCmsWidgetSelect } from '../';

const SelectControl = NetlifyCmsWidgetSelect.controlComponent;

const options = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
  { value: 'baz', label: 'Baz' },
];
const stringOptions = ['foo', 'bar', 'baz'];

class SelectController extends React.Component {
  state = {
    value: this.props.defaultValue,
  };

  handleOnChange = jest.fn(value => {
    this.setState({ value });
  });

  componentDidUpdate() {
    this.props.onStateChange(this.state);
  }

  render() {
    return this.props.children({
      value: this.state.value,
      handleOnChange: this.handleOnChange,
    });
  }
}

function setup({ field, defaultValue }) {
  let renderArgs, ref;
  const stateChangeSpy = jest.fn();
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();

  const helpers = render(
    <SelectController defaultValue={defaultValue} onStateChange={stateChangeSpy}>
      {({ value, handleOnChange }) => {
        renderArgs = { value, onChangeSpy: handleOnChange };
        return (
          <SelectControl
            field={field}
            value={value}
            onChange={handleOnChange}
            forID="basic-select"
            classNameWrapper=""
            setActiveStyle={setActiveSpy}
            setInactiveStyle={setInactiveSpy}
            ref={widgetRef => (ref = widgetRef)}
            t={msg => msg}
          />
        );
      }}
    </SelectController>,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    ...renderArgs,
    stateChangeSpy,
    setActiveSpy,
    setInactiveSpy,
    ref,
    input,
  };
}

function clickClearButton(container) {
  const allSvgs = container.querySelectorAll('svg');
  const clear = allSvgs[allSvgs.length - 2];

  fireEvent.mouseDown(clear, {
    button: 0,
  });
}

describe('Select widget', () => {
  it('should call onChange with correct selectedItem', () => {
    const field = fromJS({ options });
    const { getByText, input, onChangeSpy } = setup({ field });

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(getByText('Foo'));

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(options[0].value);
  });

  it('should call onChange with null when no item is selected', () => {
    const field = fromJS({ options, required: false });
    const { input, onChangeSpy } = setup({ field, defaultValue: options[0].value });

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Delete' });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(null);
  });

  it('should call onChange with null when selection is cleared', () => {
    const field = fromJS({ options, required: false });
    const { onChangeSpy, container } = setup({ field, defaultValue: options[0].value });

    clickClearButton(container);

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(null);
  });

  it('should respect default value', () => {
    const field = fromJS({ options });
    const { getByText } = setup({ field, defaultValue: options[2].value });

    expect(getByText('Baz')).toBeInTheDocument();
  });

  it('should respect default value when options are string only', () => {
    const field = fromJS({ options: stringOptions });
    const { getByText } = setup({
      field,
      defaultValue: stringOptions[2],
    });

    expect(getByText('baz')).toBeInTheDocument();
  });

  describe('with multiple', () => {
    it('should call onChange with correct selectedItem', () => {
      const field = fromJS({ options, multiple: true });
      const { getByText, input, onChangeSpy } = setup({ field });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(getByText('Foo'));
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(getByText('Baz'));

      expect(onChangeSpy).toHaveBeenCalledTimes(2);
      expect(onChangeSpy).toHaveBeenCalledWith(fromJS([options[0].value]));
      expect(onChangeSpy).toHaveBeenCalledWith(fromJS([options[0].value, options[2].value]));
    });

    it('should call onChange with correct selectedItem when item is removed', () => {
      const field = fromJS({ options, multiple: true });
      const { container, onChangeSpy } = setup({
        field,
        defaultValue: fromJS([options[1].value, options[2].value]),
      });

      fireEvent.click(container.querySelector('svg'), { button: 0 });

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(fromJS([options[2].value]));
    });

    it('should call onChange with empty list on mount when required is true', () => {
      const field = fromJS({ options, multiple: true, required: true });
      const { onChangeSpy } = setup({
        field,
      });
      expect(onChangeSpy).toHaveBeenCalledWith(List());
    });

    it('should not call onChange with empty list on mount when required is false', () => {
      const field = fromJS({ options, multiple: true });
      const { onChangeSpy } = setup({
        field,
      });
      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('should call onChange with empty list when no item is selected and required is true', () => {
      const field = fromJS({ options, multiple: true });
      const { input, onChangeSpy } = setup({
        field,
        defaultValue: fromJS([options[1].value]),
      });

      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'Delete' });

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(null);
    });

    it('should call onChange with value in list on mount when value is not a list and required is true', () => {
      const field = fromJS({ options, multiple: true, required: true });
      const { onChangeSpy } = setup({
        field,
        defaultValue: options[1].value,
      });
      expect(onChangeSpy).toHaveBeenCalledWith(fromJS([options[1].value]));
    });

    it('should call onChange with empty list when selection is cleared and required is true', () => {
      const field = fromJS({ options, multiple: true, required: true });
      const { container, onChangeSpy } = setup({
        field,
        defaultValue: fromJS([options[1].value]),
      });

      clickClearButton(container);

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(List());
    });

    it('should call onChange with null when selection is cleared and required is false', () => {
      const field = fromJS({ options, multiple: true, required: false });
      const { container, onChangeSpy } = setup({
        field,
        defaultValue: fromJS([options[1].value]),
      });

      clickClearButton(container);

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(null);
    });

    it('should respect default value', () => {
      const field = fromJS({ options, multiple: true });
      const { getByText } = setup({
        field,
        defaultValue: fromJS([options[1].value, options[2].value]),
      });

      expect(getByText('Bar')).toBeInTheDocument();
      expect(getByText('Baz')).toBeInTheDocument();
    });

    it('should respect default value when options are string only', () => {
      const field = fromJS({ options: stringOptions, multiple: true });
      const { getByText } = setup({
        field,
        defaultValue: fromJS([stringOptions[1], stringOptions[2]]),
      });

      expect(getByText('bar')).toBeInTheDocument();
      expect(getByText('baz')).toBeInTheDocument();
    });
  });
  describe('validation', () => {
    function validate(setupOpts) {
      const { ref } = setup(setupOpts);
      const { error } = ref.isValid();
      return error?.message;
    }
    it('should fail with less items than min allows', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 2 }),
        defaultValue: fromJS([stringOptions[0]]),
      };
      expect(validate(opts)).toMatchInlineSnapshot(`"editor.editorControlPane.widget.rangeMin"`);
    });
    it('should fail with more items than max allows', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, max: 1 }),
        defaultValue: fromJS([stringOptions[0], stringOptions[1]]),
      };
      expect(validate(opts)).toMatchInlineSnapshot(`"editor.editorControlPane.widget.rangeMax"`);
    });
    it('should enforce min when both min and max are set', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 2, max: 3 }),
        defaultValue: fromJS([stringOptions[0]]),
      };
      expect(validate(opts)).toMatchInlineSnapshot(`"editor.editorControlPane.widget.rangeCount"`);
    });
    it('should enforce max when both min and max are set', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 1, max: 2 }),
        defaultValue: fromJS([stringOptions[0], stringOptions[1], stringOptions[2]]),
      };
      expect(validate(opts)).toMatchInlineSnapshot(`"editor.editorControlPane.widget.rangeCount"`);
    });
    it('should enforce min and max when they are the same value', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 2, max: 2 }),
        defaultValue: fromJS([stringOptions[0], stringOptions[1], stringOptions[2]]),
      };
      expect(validate(opts)).toMatchInlineSnapshot(
        `"editor.editorControlPane.widget.rangeCountExact"`,
      );
    });
    it('should pass when min is met', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 1 }),
        defaultValue: fromJS([stringOptions[0]]),
      };
      expect(validate(opts)).toBeUndefined();
    });
    it('should pass when max is met', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, max: 1 }),
        defaultValue: fromJS([stringOptions[0]]),
      };
      expect(validate(opts)).toBeUndefined();
    });
    it('should pass when both min and max are met', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 2, max: 3 }),
        defaultValue: fromJS([stringOptions[0], stringOptions[1]]),
      };
      expect(validate(opts)).toBeUndefined();
    });
    it('should pass when both min and max are met, and are the same value', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 2, max: 2 }),
        defaultValue: fromJS([stringOptions[0], stringOptions[1]]),
      };
      expect(validate(opts)).toBeUndefined();
    });
    it('should not fail on min/max if multiple is not true', () => {
      const opts = {
        field: fromJS({ options: stringOptions, min: 2, max: 2 }),
        defaultValue: fromJS([stringOptions[0]]),
      };
      expect(validate(opts)).toBeUndefined();
    });
    it('should not fail for empty field (should work for optional field)', () => {
      const opts = {
        field: fromJS({ options: stringOptions, multiple: true, min: 2 }),
      };
      const { ref, input, getByText, container } = setup(opts);
      expect(ref.isValid().error?.message).toBeUndefined();
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(getByText('foo'));
      expect(ref.isValid().error?.message).toMatchInlineSnapshot(
        `"editor.editorControlPane.widget.rangeMin"`,
      );
      clickClearButton(container);
      expect(ref.isValid().error?.message).toBeUndefined();
    });
  });
});
