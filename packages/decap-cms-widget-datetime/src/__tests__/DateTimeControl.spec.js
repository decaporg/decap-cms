import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';

import DateTimeControl from '../DateTimeControl';

describe('DateTimeControl', () => {
  const field = {
    get: jest.fn(),
  };
  const props = {
    field,
    forID: 'test-datetime',
    onChange: jest.fn(),
    classNameWrapper: 'classNameWrapper',
    setActiveStyle: jest.fn(),
    setInactiveStyle: jest.fn(),
    value: '',
    t: key => key,
    isDisabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with input, now button, and clear button', () => {
    const { getByTestId } = render(<DateTimeControl {...props} />);
    expect(getByTestId('test-datetime')).toBeInTheDocument();
    expect(getByTestId('now-button')).toBeInTheDocument();
    expect(getByTestId('clear-button')).toBeInTheDocument();
  });

  test('set value to current time if now button is clicked', () => {
    const { getByTestId } = render(<DateTimeControl {...props} value="" />);
    const nowButton = getByTestId('now-button');
    const input = getByTestId('test-datetime');
    fireEvent.click(nowButton);
    expect(input.value).toBe(dayjs().format('YYYY-MM-DD'));
  });

  test('set value to empty string if clear button is clicked', () => {
    const { getByTestId } = render(<DateTimeControl {...props} value="1970-01-01" />);
    const clearButton = getByTestId('clear-button');
    const input = getByTestId('test-datetime');
    fireEvent.click(clearButton);
    expect(input.value).toBe('');
  });
});
