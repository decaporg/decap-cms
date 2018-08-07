import { Map } from 'immutable';
/*
* Reducer for some global UI state that we want to share between components
* */
const globalUI = (state = Map({ isFetching: false }), action) => {
  // Generic, global loading indicator
  if (action.type.indexOf('REQUEST') > -1) {
    return state.set('isFetching', true);
  } else if (action.type.indexOf('SUCCESS') > -1 || action.type.indexOf('FAILURE') > -1) {
    return state.set('isFetching', false);
  }
  return state;
};

export default globalUI;
