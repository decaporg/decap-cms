import { configLoaded, configLoading, configFailed, mergeConfig } from '../../actions/config';
import config, { selectLocale, defaultState } from '../config';

describe('config', () => {
  it('should handle an empty state', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore config reducer doesn't accept empty action
    expect(config(undefined, {})).toEqual(defaultState);
  });

  it('should handle an update', () => {
    expect(
      config(
        defaultState,
        configLoaded({ ...defaultState, locale: 'fr', backend: { name: 'test-repo' } }),
      ),
    ).toEqual({
      ...defaultState,
      locale: 'fr',
      backend: { name: 'test-repo' },
    });
  });

  it('should mark the config as loading', () => {
    expect(config(undefined, configLoading())).toEqual({ ...defaultState, isFetching: true });
  });

  it('should handle an error', () => {
    expect(config(defaultState, configFailed(new Error('Config could not be loaded')))).toEqual({
      ...defaultState,
      error: 'Error: Config could not be loaded',
    });
  });

  it('should handle configs merging', () => {
    expect(
      config(
        { ...defaultState, backend: { name: 'git-gateway' } },
        mergeConfig({ ...defaultState, locale: 'fr', backend: { branch: 'main' } }),
      ),
    ).toEqual({
      ...defaultState,
      locale: 'fr',
      backend: { name: 'git-gateway', branch: 'main' },
    });
  });

  it('should default to "en" locale', () => {
    expect(selectLocale(defaultState)).toEqual('en');
  });
});
