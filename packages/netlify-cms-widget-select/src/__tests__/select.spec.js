import React from 'react';
import { fromJS } from 'immutable';
import { render, fireEvent } from 'react-testing-library';
import 'react-testing-library/cleanup-after-each';
import 'jest-dom/extend-expect';
import { SelectControl } from '../';

const options = [
  { value: 'Foo', label: 'Foo' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Baz', label: 'Baz' },
];

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
  let renderArgs;
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
    input,
  };
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

  it('should respect value', () => {
    const field = fromJS({ options });
    const { getByText } = setup({ field, defaultValue: options[2].value });

    expect(getByText('Baz')).toBeInTheDocument();
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

    it('should respect value', () => {
      const field = fromJS({ options, multiple: true });
      const { getByText } = setup({
        field,
        defaultValue: fromJS([options[1].value, options[2].value]),
      });

      expect(getByText('Bar')).toBeInTheDocument();
      expect(getByText('Baz')).toBeInTheDocument();
    });
  });
});
