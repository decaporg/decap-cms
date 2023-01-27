import React from 'react';
import { fromJS } from 'immutable';
import { render, fireEvent } from '@testing-library/react';

import { NetlifyCmsWidgetColorString } from '../';

const ColorControl = NetlifyCmsWidgetColorString.controlComponent;

const fieldSettings = {
  allowInput: false,
};

function setup({ field, defaultValue } = {}) {
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();
  const onChangeSpy = jest.fn();

  const helpers = render(
    <ColorControl
      field={field}
      value={defaultValue}
      onChange={onChangeSpy}
      forID="test-string"
      classNameWrapper="test-classname"
      setActiveStyle={setActiveSpy}
      setInactiveStyle={setInactiveSpy}
    />,
  );

  const input = helpers.container.querySelector('input');

  jest.useFakeTimers();

  return {
    ...helpers,
    setActiveSpy,
    setInactiveSpy,
    onChangeSpy,
    input,
  };
}

describe('Color widget', () => {
  it('renders with default value', () => {
    const field = fromJS(fieldSettings);
    const testValue = '#fff000';
    const { input } = setup({ field, defaultValue: testValue });

    expect(input.value).toEqual(testValue);
  });

  describe('field.allowInput is false', () => {
    it('renders input as readonly', () => {
      const field = fromJS(fieldSettings);
      const { input } = setup({ field });

      expect(input).toMatchSnapshot();
    });

    it('opens picker on input click', () => {
      const field = fromJS(fieldSettings);
      const { input, queryByTestId } = setup({ field });

      fireEvent.click(input);

      expect(queryByTestId('color-picker-container')).not.toBeNull();
    });

    it('displays clear button when input is present', () => {
      const field = fromJS(fieldSettings);
      const { queryByTestId } = setup({ field, defaultValue: '#fff000' });

      expect(queryByTestId('clear-btn-wrapper')).not.toBeNull();
    });
  });

  describe('field.allowInput is true', () => {
    const field = fromJS({ ...fieldSettings, allowInput: true });

    it('calls onChange when input changes', () => {
      const testValue = '#fff000';
      const { input, onChangeSpy } = setup({ field });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: testValue } });

      jest.runAllTimers();

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith(testValue);
    });

    it('sets input value', () => {
      const testValue = '#fff000';
      const { input } = setup({ field });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: testValue } });

      jest.runAllTimers();

      expect(input.value).toEqual(testValue);
    });

    it('does not open picker on input click', () => {
      const { input, queryByTestId } = setup({ field });

      fireEvent.click(input);

      expect(queryByTestId('color-picker-container')).toBeNull();
    });

    it('calls setActiveStyle when input focused', () => {
      const { input, setActiveSpy } = setup({ field });

      fireEvent.focus(input);

      expect(setActiveSpy).toHaveBeenCalledTimes(1);
    });

    it('calls setInactiveSpy when input blurred', () => {
      const { input, setInactiveSpy } = setup({ field });

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(setInactiveSpy).toHaveBeenCalledTimes(1);
    });
  });
});
