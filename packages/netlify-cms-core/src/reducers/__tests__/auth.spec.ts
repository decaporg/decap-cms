import { fromJS } from 'immutable';
import { authenticating, authenticate, authError, logout } from '../../actions/auth';
import auth, { defaultState } from '../auth';

describe('auth', () => {
  it('should handle an empty state', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    expect(auth(undefined, {})).toEqual(defaultState);
  });

  it('should handle an authentication request', () => {
    expect(auth(undefined, authenticating())).toEqual(defaultState.set('isFetching', true));
  });

  it('should handle authentication', () => {
    const user = { name: 'joe', token: 'token' };
    expect(auth(undefined, authenticate(user))).toEqual(defaultState.set('user', fromJS(user)));
  });

  it('should handle an authentication error', () => {
    expect(auth(undefined, authError(new Error('Bad credentials')))).toEqual(
      defaultState.set('error', 'Error: Bad credentials'),
    );
  });

  it('should handle logout', () => {
    const user = { name: 'joe', token: 'token' };
    const newState = auth(defaultState.set('user', fromJS(user)), logout());
    expect(newState.get('user')).toBeUndefined();
  });
});
