import React from 'react';
import { fromJS } from 'immutable';
import { render } from '@testing-library/react';

import { DecapCmsWidgetBoolean } from '../';

const BooleanControl = DecapCmsWidgetBoolean.controlComponent;

function setup({ field, value = false }) {
  const onChangeSpy = jest.fn();
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();

  const helpers = render(
    <BooleanControl
      field={field}
      value={value}
      onChange={onChangeSpy}
      forID="test-boolean"
      classNameWrapper=""
      setActiveStyle={setActiveSpy}
      setInactiveStyle={setInactiveSpy}
    />,
  );

  return {
    ...helpers,
    onChangeSpy,
    setActiveSpy,
    setInactiveSpy,
  };
}

describe('Boolean widget', () => {
  it('should render the toggle without prefix or suffix by default', () => {
    const field = fromJS({ name: 'test' });
    const { queryByText } = setup({ field });

    expect(queryByText('OFF')).toBeNull();
    expect(queryByText('ON')).toBeNull();
  });

  it('should render prefix text when prefix is configured', () => {
    const field = fromJS({ name: 'test', prefix: 'OFF' });
    const { getByText, queryByText } = setup({ field });

    expect(getByText(/OFF/)).toBeInTheDocument();
    expect(queryByText('ON')).toBeNull();
  });

  it('should render suffix text when suffix is configured', () => {
    const field = fromJS({ name: 'test', suffix: 'ON' });
    const { getByText, queryByText } = setup({ field });

    expect(queryByText('OFF')).toBeNull();
    expect(getByText(/ON/)).toBeInTheDocument();
  });

  it('should render both prefix and suffix when both are configured', () => {
    const field = fromJS({ name: 'test', prefix: 'OFF', suffix: 'ON' });
    const { getByText } = setup({ field });

    expect(getByText(/OFF/)).toBeInTheDocument();
    expect(getByText(/ON/)).toBeInTheDocument();
  });

  it('should not render prefix or suffix for empty strings', () => {
    const field = fromJS({ name: 'test', prefix: '', suffix: '' });
    const { queryByText } = setup({ field });

    expect(queryByText('OFF')).toBeNull();
    expect(queryByText('ON')).toBeNull();
  });
});
