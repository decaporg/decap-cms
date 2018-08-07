// Based on wait-service by Mozilla:
// https://github.com/mozilla/gecko-dev/blob/master/devtools/client/shared/redux/middleware/wait-service.js

/**
 * A middleware that provides the ability for actions to install a
 * function to be run once when a specific condition is met by an
 * action coming through the system. Think of it as a thunk that
 * blocks until the condition is met.
 */
export const WAIT_UNTIL_ACTION = 'WAIT_UNTIL_ACTION';

export default function waitUntilAction({ dispatch, getState }) {
  let pending = [];

  function checkPending(action) {
    const readyRequests = [];
    const stillPending = [];

    // Find the pending requests whose predicates are satisfied with
    // this action. Wait to run the requests until after we update the
    // pending queue because the request handler may synchronously
    // dispatch again and run this service (that use case is
    // completely valid).
    for (const request of pending) {
      if (request.predicate(action)) {
        readyRequests.push(request);
      } else {
        stillPending.push(request);
      }
    }

    pending = stillPending;
    for (const request of readyRequests) {
      request.run(dispatch, getState, action);
    }
  }

  return next => action => {
    if (action.type === WAIT_UNTIL_ACTION) {
      pending.push(action);
      return null;
    }
    const result = next(action);
    checkPending(action);
    return result;
  };
}
