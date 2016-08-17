import { Map, List } from 'immutable';
import { SWITCH_VISUAL_MODE, REGISTER_COMPONENT } from '../actions/editor';

const editor = (state = Map({ useVisualMode: true, registeredComponents: List() }), action) => {
  switch (action.type) {
    case SWITCH_VISUAL_MODE:
      return state.setIn(['useVisualMode'], action.payload);
    case REGISTER_COMPONENT:
      return state.updateIn(['registeredComponents'], list => list.push(action.payload));
    default:
      return state;
  }
};

export default editor;
