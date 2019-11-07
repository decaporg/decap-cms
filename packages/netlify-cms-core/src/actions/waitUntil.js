import { WAIT_UNTIL_ACTION } from '../redux/middleware/waitUntilAction';

export function waitUntil({ predicate, run }) {
  return {
    type: WAIT_UNTIL_ACTION,
    predicate,
    run,
  };
}
