/* Reducer for some global UI state that we want to share between components
* Now being used for isFetching state to display global loading indicator
* */

const globalReducer = (state = { isFetching: false }, action) => {
  if ((action.type.indexOf('REQUEST') > -1)) {
    return { isFetching: true };
  } else if (
    (action.type.indexOf('SUCCESS') > -1) ||
    (action.type.indexOf('FAILURE') > -1)
  ) {
    return { isFetching: false };
  }
  return state;
};

export default globalReducer;
