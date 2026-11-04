import { fromJS } from 'immutable';
import { render, fireEvent } from '@testing-library/react';

import BooleanControl from '../BooleanControl';

function setup(overrides = {}) {
  const props = {
    field: fromJS({ name: 'published' }),
    onChange: jest.fn(),
    forID: 'test-boolean',
    classNameWrapper: '',
    setActiveStyle: jest.fn(),
    setInactiveStyle: jest.fn(),
    ...overrides,
  };

  return { ...render(<BooleanControl {...props} />), props };
}

describe('BooleanControl', () => {
  it('reflects the value it is given', () => {
    const { getByRole } = setup({ value: true });

    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value', () => {
    const { getByRole, props } = setup({ value: false });

    fireEvent.click(getByRole('switch'));

    expect(props.onChange).toHaveBeenCalledWith(true);
  });

  it('updates when the value changes from outside the control', () => {
    const { getByRole, props, rerender } = setup({ value: true });

    rerender(<BooleanControl {...props} value={false} />);

    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});
