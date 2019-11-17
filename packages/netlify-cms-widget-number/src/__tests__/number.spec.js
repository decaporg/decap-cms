import React from 'react';
import { fromJS } from 'immutable';
import { render, fireEvent } from '@testing-library/react';
import { NetlifyCmsWidgetNumber } from '../';
import { validateMinMax } from '../NumberControl';

const NumberControl = NetlifyCmsWidgetNumber.controlComponent;

const fieldSettings = {
  min: -20,
  max: 20,
  step: 1,
  valueType: 'int',
};

class NumberController extends React.Component {
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
  let renderArgs;
  const stateChangeSpy = jest.fn();
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();

  const helpers = render(
    <NumberController defaultValue={defaultValue} onStateChange={stateChangeSpy}>
      {({ value, handleOnChange }) => {
        renderArgs = { value, onChangeSpy: handleOnChange };
        return (
          <NumberControl
            field={field}
            value={value}
            onChange={handleOnChange}
            forID="test-number"
            classNameWrapper=""
            setActiveStyle={setActiveSpy}
            setInactiveStyle={setInactiveSpy}
            t={jest.fn()}
          />
        );
      }}
    </NumberController>,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    ...renderArgs,
    stateChangeSpy,
    setActiveSpy,
    setInactiveSpy,
    input,
  };
}

describe('Number widget', () => {
  it('should call onChange when input changes', () => {
    const field = fromJS(fieldSettings);
    const testValue = Math.floor(Math.random() * (20 - -20 + 1)) + -20;
    const { input, onChangeSpy } = setup({ field });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(testValue) } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(testValue);
  });

  it('should call onChange with empty string when no value is set', () => {
    const field = fromJS(fieldSettings);
    const { input, onChangeSpy } = setup({ field, defaultValue: 20 });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('');
  });

  it('should call onChange with empty string when a non numeric value is set', () => {
    const field = fromJS(fieldSettings);
    const { input, onChangeSpy } = setup({ field, defaultValue: 20 });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'invalid' } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('');
  });

  it('should parse float numbers as integers', () => {
    const field = fromJS(fieldSettings);
    const testValue = (Math.random() * (20 - -20 + 1) + -20).toFixed(2);
    const { input, onChangeSpy } = setup({ field });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(testValue) } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(parseInt(testValue, 10));
  });

  it('should parse float numbers as float', () => {
    const field = fromJS({ ...fieldSettings, valueType: 'float' });
    const testValue = (Math.random() * (20 - -20 + 1) + -20).toFixed(2);
    const { input, onChangeSpy } = setup({ field });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(testValue) } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(parseFloat(testValue));
  });

  it('should allow 0 as a value', () => {
    const field = fromJS(fieldSettings);
    const testValue = 0;
    const { input } = setup({ field });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(testValue) } });

    expect(input.value).toBe('0');
  });

  describe('validateMinMax', () => {
    const field = { get: jest.fn() };
    field.get.mockReturnValue('label');
    const t = jest.fn();
    t.mockImplementation((_, params) => params);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return error when min max are defined and value is out of range', () => {
      const error = validateMinMax(5, 0, 1, field, t);
      const expectedMessage = {
        fieldLabel: 'label',
        minValue: 0,
        maxValue: 1,
      };
      expect(error).not.toBeNull();
      expect(error).toEqual({
        type: 'RANGE',
        message: expectedMessage,
      });
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('editor.editorControlPane.widget.range', expectedMessage);
    });

    it('should return error when min is defined and value is out of range', () => {
      const error = validateMinMax(5, 6, false, field, t);
      const expectedMessage = {
        fieldLabel: 'label',
        minValue: 6,
      };
      expect(error).not.toBeNull();
      expect(error).toEqual({
        type: 'RANGE',
        message: expectedMessage,
      });
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('editor.editorControlPane.widget.min', expectedMessage);
    });

    it('should return error when max is defined and value is out of range', () => {
      const error = validateMinMax(5, false, 3, field, t);
      const expectedMessage = {
        fieldLabel: 'label',
        maxValue: 3,
      };
      expect(error).not.toBeNull();
      expect(error).toEqual({
        type: 'RANGE',
        message: expectedMessage,
      });
      expect(t).toHaveBeenCalledTimes(1);
      expect(t).toHaveBeenCalledWith('editor.editorControlPane.widget.max', expectedMessage);
    });

    it('should not return error when min max are defined and value is empty', () => {
      const error = validateMinMax('', 0, 1, field, t);

      expect(error).toBeNull();
    });

    it('should not return error when min max are defined and value is in range', () => {
      const error = validateMinMax(0, -1, 1, field, t);

      expect(error).toBeNull();
    });
  });
});
