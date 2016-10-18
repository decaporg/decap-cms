import Immutable from 'immutable';
import { configLoaded, configLoading, configFailed } from '../../actions/config';
import config from '../config';

describe('config', () => {
  it('should handle an empty state', () => {
    expect(
      config(undefined, {})
    ).toEqual(
      null
    );
  });

  it('should handle an update', () => {
    expect(
      config(Immutable.Map({ a: 'b', c: 'd' }), configLoaded({ a: 'changed', e: 'new' }))
    ).toEqual(
      Immutable.Map({ a: 'changed', e: 'new' })
    );
  });

  it('should mark the config as loading', () => {
    expect(
      config(undefined, configLoading())
    ).toEqual(
      Immutable.Map({ isFetching: true })
    );
  });

  it('should handle an error', () => {
    expect(
      config(Immutable.Map({ isFetching: true }), configFailed(new Error('Config could not be loaded')))
    ).toEqual(
      Immutable.Map({ error: 'Error: Config could not be loaded' })
    );
  });
});
