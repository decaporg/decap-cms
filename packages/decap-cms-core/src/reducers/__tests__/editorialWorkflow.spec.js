import { Map } from 'immutable';

import { CONFIG_SUCCESS } from '../../actions/config';
import editorialWorkflow from '../editorialWorkflow';

describe('editorial workflow reducer', () => {
  it('initializes unpublished entry state for simple draft mode', () => {
    const state = editorialWorkflow(undefined, {
      type: CONFIG_SUCCESS,
      payload: { publish_mode: 'simple_draft' },
    });

    expect(state).toEqual(Map({ entities: Map(), pages: Map() }));
  });
});
