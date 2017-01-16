/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
/**
 * A middleware which acts like a service, because it is stateful
 * and "long-running" in the background. It provides the ability
 * for actions to install a function to be run once when a specific
 * condition is met by an action coming through the system. Think of
 * it as a thunk that blocks until the condition is met. Example:
 *
 * ```js
 * const services = { WAIT_UNTIL: require('wait-service').NAME };
 *
 * { type: services.WAIT_UNTIL,
 *   predicate: action => action.type === constants.ADD_ITEM,
 *   run: (dispatch, getState, action) => {
 *     // Do anything here. You only need to accept the arguments
 *     // if you need them. `action` is the action that satisfied
 *     // the predicate.
 *   }
 * }
 * ```
 */
const NAME = exports.NAME = "@@service/waitUntil";

function waitUntilService({ dispatch, getState }) {
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

  return next => (action) => {
    if (action.type === NAME) {
      pending.push(action);
      return null;
    }
    const result = next(action);
    checkPending(action);
    return result;
  };
}
exports.waitUntilService = waitUntilService;
