import { WAIT_UNTIL_ACTION, WaitActionArgs } from '../redux/middleware/waitUntilAction';

export function waitUntil({ predicate, run }: WaitActionArgs) {
  return {
    type: WAIT_UNTIL_ACTION,
    predicate,
    run,
  };
}
