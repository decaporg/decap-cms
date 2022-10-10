import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { NetlifyCmsWidgetText } from '../';

const TextControl = NetlifyCmsWidgetText.controlComponent;

function setup({ defaultValue } = {}) {
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();
  const onChangeSpy = jest.fn();

  const helpers = render(
    <TextControl
      value={defaultValue}
      onChange={onChangeSpy}
      forID="test-string"
      classNameWrapper="test-classname"
      setActiveStyle={setActiveSpy}
      setInactiveStyle={setInactiveSpy}
    />,
  );

  const textarea = helpers.container.querySelector('textarea');

  return {
    ...helpers,
    setActiveSpy,
    setInactiveSpy,
    onChangeSpy,
    textarea,
  };
}

describe('String widget', () => {
  it('calls setActiveStyle when textarea focused', () => {
    const { textarea, setActiveSpy } = setup();

    fireEvent.focus(textarea);

    expect(setActiveSpy).toBeCalledTimes(1);
  });

  it('calls setInactiveSpy when textarea blurred', () => {
    const { textarea, setInactiveSpy } = setup();

    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    expect(setInactiveSpy).toBeCalledTimes(1);
  });

  it('renders with default value', () => {
    const testValue = 'bar';
    const { textarea } = setup({ defaultValue: testValue });
    expect(textarea.value).toEqual(testValue);
  });

  it('calls onChange when textarea changes', () => {
    jest.useFakeTimers();
    const testValue = 'foo';
    const { textarea, onChangeSpy } = setup();

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: testValue } });

    jest.runAllTimers();

    expect(onChangeSpy).toBeCalledTimes(1);
    expect(onChangeSpy).toBeCalledWith(testValue);
  });

  it('sets input value', () => {
    const testValue = 'foo';
    const { textarea } = setup({ defaultValue: 'bar' });

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: testValue } });

    jest.runAllTimers();

    expect(textarea.value).toEqual(testValue);
  });
});
