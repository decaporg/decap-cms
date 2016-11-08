import { Map } from 'immutable';
import { TOGGLE_SIDEBAR, OPEN_SIDEBAR } from '../actions/globalUI';
/*
* Reducer for some global UI state that we want to share between components
* */
const globalUI = (state = Map({ isFetching: false, sidebarIsOpen: true }), action) => {
  // Generic, global loading indicator
  if ((action.type.indexOf('REQUEST') > -1)) {
    return state.set('isFetching', true);
  } else if (
    (action.type.indexOf('SUCCESS') > -1) ||
    (action.type.indexOf('FAILURE') > -1)
  ) {
    return state.set('isFetching', false);
  }

  switch (action.type) {
    case TOGGLE_SIDEBAR:
      return state.set('sidebarIsOpen', !state.get('sidebarIsOpen'));
    case OPEN_SIDEBAR:
      return state.set('sidebarIsOpen', action.payload.open);
    default:
      return state;
  }
};

export default globalUI;
