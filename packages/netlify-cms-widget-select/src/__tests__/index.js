import 'react-testing-library/cleanup-after-each';
import React from 'react';
import { fromJS } from 'immutable';
import { render, fireEvent } from 'react-testing-library';
import { SelectControl } from '../';

const options = [
  { value: 'Foo', label: 'Foo' },
  { value: 'Bar', label: 'Bar' },
  { value: 'Baz', label: 'Baz' },
];

function noop() {}

function renderSelect({ field }) {
  const onChangeFn = jest.fn();
  const helpers = render(
    <SelectControl
      field={field}
      onChange={onChangeFn}
      forID="basic-select"
      classNameWrapper=""
      setActiveStyle={noop}
      setInactiveStyle={noop}
    />,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    onChangeFn,
    input,
  };
}

describe('Select widget', () => {
  it('should work', () => {
    const field = fromJS({ options });
    const { getByText, input, onChangeFn } = renderSelect({ field });

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(getByText('Foo'));

    expect(onChangeFn).toHaveBeenCalledTimes(1);
    expect(onChangeFn).toHaveBeenCalledWith(options[0].value);
  });

  describe('with multiple', () => {
    it('should work with multiple', () => {
      const field = fromJS({ options, multiple: true });
      const { getByText, input, onChangeFn } = renderSelect({ field });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.click(getByText('Foo'));

      expect(onChangeFn).toHaveBeenCalledTimes(1);
      expect(onChangeFn).toHaveBeenCalledWith(fromJS([options[0].value]));
    });
  });
});
