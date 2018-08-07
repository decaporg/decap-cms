import Immutable from 'immutable';
import { authenticating, authenticate, authError, logout } from 'Actions/auth';
import auth from '../auth';

describe('auth', () => {
  it('should handle an empty state', () => {
    expect(auth(undefined, {})).toEqual(null);
  });

  it('should handle an authentication request', () => {
    expect(auth(undefined, authenticating())).toEqual(Immutable.Map({ isFetching: true }));
  });

  it('should handle authentication', () => {
    expect(auth(undefined, authenticate({ email: 'joe@example.com' }))).toEqual(
      Immutable.fromJS({ user: { email: 'joe@example.com' } }),
    );
  });

  it('should handle an authentication error', () => {
    expect(auth(undefined, authError(new Error('Bad credentials')))).toEqual(
      Immutable.Map({
        error: 'Error: Bad credentials',
      }),
    );
  });

  it('should handle logout', () => {
    const initialState = Immutable.fromJS({ user: { email: 'joe@example.com' } });
    const newState = auth(initialState, logout());
    expect(newState.get('user')).toBeUndefined();
  });
});
