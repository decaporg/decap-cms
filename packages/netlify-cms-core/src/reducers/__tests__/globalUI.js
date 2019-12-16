import { Map } from 'immutable';
import { USE_OPEN_AUTHORING } from 'Actions/auth';
import {
  DEPLOY_PREVIEW_REQUEST,
  DEPLOY_PREVIEW_SUCCESS,
  DEPLOY_PREVIEW_FAILURE,
} from 'Actions/deploys';
import { ENTRY_REQUEST, ENTRY_SUCCESS, ENTRY_FAILURE } from 'Actions/entries';
import reducer from '../globalUI';

describe('globalUI', () => {
  it('should set isFetching to true on entry request', () => {
    expect(reducer(Map({ isFetching: false }), { type: ENTRY_REQUEST })).toEqual(
      Map({ isFetching: true }),
    );
  });

  it('should set isFetching to false on entry success', () => {
    expect(reducer(Map({ isFetching: true }), { type: ENTRY_SUCCESS })).toEqual(
      Map({ isFetching: false }),
    );
  });

  it('should set isFetching to false on entry failure', () => {
    expect(reducer(Map({ isFetching: true }), { type: ENTRY_FAILURE })).toEqual(
      Map({ isFetching: false }),
    );
  });

  it('should not change state on deploy preview request', () => {
    const state = Map({ isFetching: false });
    expect(reducer(state, { type: DEPLOY_PREVIEW_REQUEST })).toBe(state);
  });

  it('should not change state on deploy preview success', () => {
    const state = Map({ isFetching: true });
    expect(reducer(state, { type: DEPLOY_PREVIEW_SUCCESS })).toBe(state);
  });

  it('should not change state on deploy preview failure', () => {
    const state = Map({ isFetching: true });
    expect(reducer(state, { type: DEPLOY_PREVIEW_FAILURE })).toBe(state);
  });

  it('should set useOpenAuthoring to true on USE_OPEN_AUTHORING', () => {
    expect(reducer(Map({ useOpenAuthoring: false }), { type: USE_OPEN_AUTHORING })).toEqual(
      Map({ useOpenAuthoring: true }),
    );
  });
});
