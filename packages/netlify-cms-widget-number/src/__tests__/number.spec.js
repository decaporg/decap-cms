import React from 'react';
import { fromJS } from 'immutable';
import { render, fireEvent } from 'react-testing-library';
import 'react-testing-library/cleanup-after-each';
import 'jest-dom/extend-expect';
import { NetlifyCmsWidgetNumber } from '../';

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

  it('should allow 0 as a value', () => {
    const field = fromJS(fieldSettings);
    const testValue = 0;
    const { input } = setup({ field });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: String(testValue) } });

    expect(input.value).toBe('0');
  });
});
