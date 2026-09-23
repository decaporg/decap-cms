import { Map, fromJS } from 'immutable';

import { CONFIG_SUCCESS } from '../../actions/config';
import editorialWorkflow from '../editorialWorkflow';

describe('editorialWorkflow', () => {
  it('initializes unpublished entry state for simple draft mode', () => {
    const state = editorialWorkflow(undefined, {
      type: CONFIG_SUCCESS,
      payload: { publish_mode: 'simple_draft' },
    });

    expect(state).toEqual(Map({ entities: Map(), pages: Map() }));
  });

  it('stops loading unpublished entries after a failure', () => {
    const state = fromJS({ pages: { isFetching: true } });
    const action = { type: 'UNPUBLISHED_ENTRIES_FAILURE' };

    expect(editorialWorkflow(state, action).getIn(['pages', 'isFetching'])).toBe(false);
  });
});
