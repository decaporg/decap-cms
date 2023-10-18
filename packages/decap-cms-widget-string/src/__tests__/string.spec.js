import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { NetlifyCmsWidgetString } from '../';

const StringControl = NetlifyCmsWidgetString.controlComponent;

function setup({ defaultValue } = {}) {
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();
  const onChangeSpy = jest.fn();

  const helpers = render(
    <StringControl
      value={defaultValue}
      onChange={onChangeSpy}
      forID="test-string"
      classNameWrapper="test-classname"
      setActiveStyle={setActiveSpy}
      setInactiveStyle={setInactiveSpy}
    />,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    setActiveSpy,
    setInactiveSpy,
    onChangeSpy,
    input,
  };
}

describe('String widget', () => {
  it('calls setActiveStyle when input focused', () => {
    const { input, setActiveSpy } = setup();

    fireEvent.focus(input);

    expect(setActiveSpy).toBeCalledTimes(1);
  });

  it('calls setInactiveSpy when input blurred', () => {
    const { input, setInactiveSpy } = setup();

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(setInactiveSpy).toBeCalledTimes(1);
  });

  it('renders with default value', () => {
    const testValue = 'bar';
    const { input } = setup({ defaultValue: testValue });
    expect(input.value).toEqual(testValue);
  });

  it('calls onChange when input changes', () => {
    jest.useFakeTimers();
    const testValue = 'foo';
    const { input, onChangeSpy } = setup();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: testValue } });

    jest.runAllTimers();

    expect(onChangeSpy).toBeCalledTimes(1);
    expect(onChangeSpy).toBeCalledWith(testValue);
  });

  it('sets input value', () => {
    const testValue = 'foo';
    const { input } = setup({ defaultValue: 'bar' });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: testValue } });

    jest.runAllTimers();

    expect(input.value).toEqual(testValue);
  });
});
