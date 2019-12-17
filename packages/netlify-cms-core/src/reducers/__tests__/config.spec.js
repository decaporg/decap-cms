import { Map } from 'immutable';
import { configLoaded, configLoading, configFailed } from 'Actions/config';
import config, { selectLocale } from 'Reducers/config';

describe('config', () => {
  it('should handle an empty state', () => {
    expect(config(undefined, {})).toEqual(Map({ isFetching: true }));
  });

  it('should handle an update', () => {
    expect(config(Map({ a: 'b', c: 'd' }), configLoaded(Map({ a: 'changed', e: 'new' })))).toEqual(
      Map({ a: 'changed', e: 'new' }),
    );
  });

  it('should mark the config as loading', () => {
    expect(config(undefined, configLoading())).toEqual(Map({ isFetching: true }));
  });

  it('should handle an error', () => {
    expect(config(Map(), configFailed(new Error('Config could not be loaded')))).toEqual(
      Map({ error: 'Error: Config could not be loaded' }),
    );
  });

  it('should default to "en" locale', () => {
    expect(selectLocale(Map())).toEqual('en');
  });
});
