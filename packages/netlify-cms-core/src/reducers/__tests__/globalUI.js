import { USE_OPEN_AUTHORING } from '../../actions/auth';
import {
  DEPLOY_PREVIEW_REQUEST,
  DEPLOY_PREVIEW_SUCCESS,
  DEPLOY_PREVIEW_FAILURE,
} from '../../actions/deploys';
import { ENTRY_REQUEST, ENTRY_SUCCESS, ENTRY_FAILURE } from '../../actions/entries';
import reducer from '../globalUI';

describe('globalUI', () => {
  it('should set isFetching to true on entry request', () => {
    expect(reducer({ isFetching: false }, { type: ENTRY_REQUEST })).toEqual({ isFetching: true });
  });

  it('should set isFetching to false on entry success', () => {
    expect(reducer({ isFetching: true }, { type: ENTRY_SUCCESS })).toEqual({ isFetching: false });
  });

  it('should set isFetching to false on entry failure', () => {
    expect(reducer({ isFetching: true }, { type: ENTRY_FAILURE })).toEqual({ isFetching: false });
  });

  it('should not change state on deploy preview request', () => {
    const state = { isFetching: false };
    expect(reducer(state, { type: DEPLOY_PREVIEW_REQUEST })).toBe(state);
  });

  it('should not change state on deploy preview success', () => {
    const state = { isFetching: true };
    expect(reducer(state, { type: DEPLOY_PREVIEW_SUCCESS })).toBe(state);
  });

  it('should not change state on deploy preview failure', () => {
    const state = { isFetching: true };
    expect(reducer(state, { type: DEPLOY_PREVIEW_FAILURE })).toBe(state);
  });

  it('should set useOpenAuthoring to true on USE_OPEN_AUTHORING', () => {
    expect(reducer({ useOpenAuthoring: false }, { type: USE_OPEN_AUTHORING })).toEqual({
      useOpenAuthoring: true,
    });
  });
});
