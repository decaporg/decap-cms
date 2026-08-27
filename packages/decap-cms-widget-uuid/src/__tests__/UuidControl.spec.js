import { fromJS } from 'immutable';
import { render } from '@testing-library/react';

import UuidControl from '../UuidControl';

jest.mock('base32-encode', () => jest.fn(() => 'AAAAAAAAABAABAAAAAAAAAAAAA'));
jest.mock('hex-to-array-buffer', () => jest.fn(value => value));

const UUID = '00000000-0000-4000-8000-000000000000';

function setup(overrides = {}) {
  const props = {
    collection: fromJS({}),
    field: fromJS({}),
    onChange: jest.fn(),
    forID: 'test-uuid',
    classNameWrapper: '',
    setActiveStyle: jest.fn(),
    setInactiveStyle: jest.fn(),
    ...overrides,
  };

  return { ...render(<UuidControl {...props} />), props };
}

describe('UuidControl', () => {
  beforeEach(() => {
    jest.spyOn(global.crypto, 'randomUUID').mockReturnValue(UUID);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates a UUID with a prefix when no value exists', () => {
    const { props } = setup({ field: fromJS({ prefix: 'post/' }) });

    expect(props.onChange).toHaveBeenCalledWith(`post/${UUID}`);
  });

  it('generates a lowercase Base32 UUID when configured', () => {
    const { props } = setup({ field: fromJS({ use_b32_encoding: true }) });

    expect(props.onChange).toHaveBeenCalledWith('aaaaaaaaabaabaaaaaaaaaaaaa');
  });

  it('preserves an existing value', () => {
    const { props } = setup({ value: 'existing-id' });

    expect(props.onChange).not.toHaveBeenCalled();
  });

  it.each(['none', 'duplicate'])(
    'does not generate in a non-default locale for an i18n: %s field',
    fieldI18n => {
      const { props } = setup({
        collection: fromJS({ i18n: { default_locale: 'en' } }),
        field: fromJS({ i18n: fieldI18n }),
        locale: 'fr',
      });

      expect(props.onChange).not.toHaveBeenCalled();
    },
  );

  it('generates in a non-default locale for a translatable field', () => {
    const { props } = setup({
      collection: fromJS({ i18n: { default_locale: 'en' } }),
      field: fromJS({ i18n: 'translate' }),
      locale: 'fr',
    });

    expect(props.onChange).toHaveBeenCalledWith(UUID);
  });
});
