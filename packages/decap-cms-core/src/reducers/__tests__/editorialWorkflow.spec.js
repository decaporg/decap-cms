import { fromJS } from 'immutable';

import editorialWorkflow from '../editorialWorkflow';

describe('editorialWorkflow', () => {
  it('stops loading unpublished entries after a failure', () => {
    const state = fromJS({ pages: { isFetching: true } });
    const action = { type: 'UNPUBLISHED_ENTRIES_FAILURE' };

    expect(editorialWorkflow(state, action).getIn(['pages', 'isFetching'])).toBe(false);
  });
});
