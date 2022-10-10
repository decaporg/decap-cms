import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { NetlifyCmsWidgetString } from '../';

const StringControl = NetlifyCmsWidgetString.controlComponent;

class StringController extends React.Component {
  state = {
    value: this.props.defaultValue,
  };

  handleOnChange = jest.fn(value => {
    this.setState({ value });
  });

  render() {
    return this.props.children({
      value: this.state.value,
      handleOnChange: this.handleOnChange,
    });
  }
}

function setup({ defaultValue } = {}) {
  let renderArgs;
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();

  const helpers = render(
    <StringController defaultValue={defaultValue}>
      {({ value, handleOnChange }) => {
        renderArgs = { value, onChangeSpy: handleOnChange };
        return (
          <StringControl
            value={value}
            onChange={handleOnChange}
            forID="test-string"
            classNameWrapper="test-classname"
            setActiveStyle={setActiveSpy}
            setInactiveStyle={setInactiveSpy}
          />
        );
      }}
    </StringController>,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    ...renderArgs,
    setActiveSpy,
    setInactiveSpy,
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
});
