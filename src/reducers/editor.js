import { Map } from 'immutable';
import { SWITCH_VISUAL_MODE } from '../actions/editor';

const editor = (state = Map({ useVisualMode: true }), action) => {
  switch (action.type) {
    case SWITCH_VISUAL_MODE:
      return state.setIn(['useVisualMode'], action.payload);
    default:
      return state;
  }
};

export default editor;
