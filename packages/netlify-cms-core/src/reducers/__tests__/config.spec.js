import { configLoaded, configLoading, configFailed } from '../../actions/config';
import config, { selectLocale } from '../config';

describe('config', () => {
  it('should handle an empty state', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore config reducer doesn't accept empty action
    expect(config(undefined, {})).toEqual({ isFetching: true });
  });

  it('should handle an update', () => {
    expect(
      config({ isFetching: true }, configLoaded({ locale: 'fr', backend: { name: 'proxy' } })),
    ).toEqual({
      locale: 'fr',
      backend: { name: 'proxy' },
      isFetching: false,
      error: undefined,
    });
  });

  it('should mark the config as loading', () => {
    expect(config({ isFetching: false }, configLoading())).toEqual({ isFetching: true });
  });

  it('should handle an error', () => {
    expect(
      config({ isFetching: true }, configFailed(new Error('Config could not be loaded'))),
    ).toEqual({
      error: 'Error: Config could not be loaded',
      isFetching: false,
    });
  });

  it('should default to "en" locale', () => {
    expect(selectLocale({})).toEqual('en');
  });
});
