import React from 'react';
import { fromJS } from 'immutable';
import { render, fireEvent } from '@testing-library/react';

import { DecapCmsWidgetString } from '../';

const StringControl = DecapCmsWidgetString.controlComponent;

function setup({ field, value = '' }) {
  const onChangeSpy = jest.fn();
  const setActiveSpy = jest.fn();
  const setInactiveSpy = jest.fn();

  const helpers = render(
    <StringControl
      field={field}
      value={value}
      onChange={onChangeSpy}
      forID="test-string"
      classNameWrapper=""
      setActiveStyle={setActiveSpy}
      setInactiveStyle={setInactiveSpy}
    />,
  );

  const input = helpers.container.querySelector('input');

  return {
    ...helpers,
    onChangeSpy,
    setActiveSpy,
    setInactiveSpy,
    input,
  };
}

describe('String widget', () => {
  it('should call onChange when input changes', () => {
    const field = fromJS({ name: 'test' });
    const { input, onChangeSpy } = setup({ field });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'hello' } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith('hello');
  });

  describe('prefix and suffix', () => {
    it('should not render prefix or suffix by default', () => {
      const field = fromJS({ name: 'test' });
      const { queryByText } = setup({ field });

      expect(queryByText('Title:')).toBeNull();
      expect(queryByText('(required)')).toBeNull();
    });

    it('should render prefix text when prefix is configured', () => {
      const field = fromJS({ name: 'test', prefix: 'Title:' });
      const { getByText } = setup({ field });

      expect(getByText(/Title:/)).toBeInTheDocument();
    });

    it('should render suffix text when suffix is configured', () => {
      const field = fromJS({ name: 'test', suffix: '(required)' });
      const { getByText } = setup({ field });

      expect(getByText(/\(required\)/)).toBeInTheDocument();
    });

    it('should render both prefix and suffix when both are configured', () => {
      const field = fromJS({ name: 'test', prefix: 'Start:', suffix: ':End' });
      const { getByText } = setup({ field });

      expect(getByText(/Start:/)).toBeInTheDocument();
      expect(getByText(/:End/)).toBeInTheDocument();
    });

    it('should not render prefix or suffix for empty strings', () => {
      const field = fromJS({ name: 'test', prefix: '', suffix: '' });
      const { queryByText } = setup({ field });

      expect(queryByText('Start:')).toBeNull();
      expect(queryByText(':End')).toBeNull();
    });

    it('should still call onChange when prefix and suffix are configured', () => {
      const field = fromJS({ name: 'test', prefix: 'Pre', suffix: 'Suf' });
      const { input, onChangeSpy } = setup({ field });

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'test value' } });

      expect(onChangeSpy).toHaveBeenCalledTimes(1);
      expect(onChangeSpy).toHaveBeenCalledWith('test value');
    });
  });
});
