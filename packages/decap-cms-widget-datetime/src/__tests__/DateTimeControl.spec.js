import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';

import DateTimeControl from '../DateTimeControl';

function setup(propsOverrides = {}) {
  const props = {
    forID: 'test-datetime',
    onChange: jest.fn(),
    classNameWrapper: 'classNameWrapper',
    setActiveStyle: jest.fn(),
    setInactiveStyle: jest.fn(),
    value: '',
    t: key => key,
    isDisabled: false,
    field: {
      get: jest.fn().mockReturnValue('DD.MM.YYYY'),
    },
    ...propsOverrides,
  };

  const utils = render(<DateTimeControl {...props} />);
  const input = utils.getByTestId('test-datetime');
  const nowButton = utils.getByTestId('now-button');
  const clearButton = utils.getByTestId('clear-button');

  return {
    ...utils,
    props,
    input,
    nowButton,
    clearButton,
  };
}

describe('DateTimeControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with input, now button, and clear button', () => {
    const { getByTestId } = setup();
    expect(getByTestId('test-datetime')).toBeInTheDocument();
    expect(getByTestId('now-button')).toBeInTheDocument();
    expect(getByTestId('clear-button')).toBeInTheDocument();
  });

  test('set value to current date if now button is clicked', () => {
    const { nowButton, props } = setup();
    fireEvent.click(nowButton);
    expect(props.onChange).toHaveBeenCalledWith(dayjs().format('DD.MM.YYYY'));
  });

  test('set value to empty string if clear button is clicked', () => {
    const { clearButton, props } = setup({ value: '1970-01-01' });
    fireEvent.click(clearButton);
    expect(props.onChange).toHaveBeenCalledWith('');
  });
});
