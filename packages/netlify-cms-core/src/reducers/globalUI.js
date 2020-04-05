import { Map } from 'immutable';
import { USE_OPEN_AUTHORING } from 'Actions/auth';

const LOADING_IGNORE_LIST = ['DEPLOY_PREVIEW', 'HISTORY_'];

const ignoreWhenLoading = action => LOADING_IGNORE_LIST.some(type => action.type.includes(type));

/*
 * Reducer for some global UI state that we want to share between components
 * */
const globalUI = (state = Map({ isFetching: false, useOpenAuthoring: false }), action) => {
  // Generic, global loading indicator
  if (!ignoreWhenLoading(action) && action.type.includes('REQUEST')) {
    return state.set('isFetching', true);
  } else if (
    !ignoreWhenLoading(action) &&
    (action.type.includes('SUCCESS') || action.type.includes('FAILURE'))
  ) {
    return state.set('isFetching', false);
  } else if (action.type === USE_OPEN_AUTHORING) {
    return state.set('useOpenAuthoring', true);
  }
  return state;
};

export default globalUI;
