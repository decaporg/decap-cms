import { useState } from 'react';
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

function ControlledDateTime({ field, initialValue }) {
  const [value, setValue] = useState(initialValue);

  return (
    <DateTimeControl
      forID="controlled-datetime"
      onChange={setValue}
      classNameWrapper="classNameWrapper"
      setActiveStyle={jest.fn()}
      setInactiveStyle={jest.fn()}
      value={value}
      t={key => key}
      isDisabled={false}
      field={field}
    />
  );
}

describe('DateTimeControl', () => {
  const mockDate = '2025-01-01T12:00:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockDate));
  });

  afterEach(() => {
    jest.useRealTimers();
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

  test('sets value in custom format (local timezone) when input value changes', () => {
    const { input, props } = setup({ field: new Map() });

    const testDate = '2024-03-15T10:30:00';

    fireEvent.change(input, { target: { value: testDate } });

    const expectedValue = dayjs(testDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    expect(props.onChange).toHaveBeenCalledWith(expectedValue);
  });

  test('sets value in custom format (UTC) when input value changes', () => {
    const { input, props } = setup({ field: new Map([['picker_utc', true]]) });

    const testDate = '2024-03-15T10:30:00';

    fireEvent.change(input, { target: { value: testDate } });

    const expectedValue = dayjs(testDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    expect(props.onChange).toHaveBeenCalledWith(expectedValue);
  });

  test('does not rewrite the year while it is being typed in a controlled date input', () => {
    const field = new Map([
      ['name', 'date'],
      ['format', 'YYYY-MM-DD'],
      ['time_format', false],
    ]);
    const { getByTestId } = render(<ControlledDateTime field={field} initialValue="2025-08-03" />);
    const input = getByTestId('controlled-datetime');

    fireEvent.focus(input);
    for (const value of ['0002-08-03', '0020-08-03', '0202-08-03', '2026-08-03']) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue(value);
    }
    fireEvent.blur(input);

    expect(input).toHaveValue('2026-08-03');
  });
});
