import { Map } from 'immutable';
import { USE_FORK_WORKFLOW } from 'Actions/auth';
/*
 * Reducer for some global UI state that we want to share between components
 * */
const globalUI = (state = Map({ isFetching: false, useForkWorkflow: false }), action) => {
  // Generic, global loading indicator
  if (action.type.indexOf('REQUEST') > -1) {
    return state.set('isFetching', true);
  } else if (action.type.indexOf('SUCCESS') > -1 || action.type.indexOf('FAILURE') > -1) {
    return state.set('isFetching', false);
  } else if (action.type === USE_FORK_WORKFLOW) {
    return state.set('useForkWorkflow', true);
  }
  return state;
};

export default globalUI;
