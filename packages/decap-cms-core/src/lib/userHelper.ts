import type { User } from 'decap-cms-lib-util';

export type UserIdentity = {
  /** Display name, or the closest thing the backend knows. */
  label: string;
  /** Shown under the label when it adds something the label doesn't. */
  email?: string;
};

/**
 * Who the editor is signed in as, for the account dropdown.
 *
 * Worth surfacing because backends can log you back in without asking: Decap
 * Turbo's dashboard session deliberately outlives a CMS logout, so the next
 * "Login with Turbo" completes silently — and until now nothing in the CMS
 * said which account that was.
 *
 * Returns undefined when the backend knows neither a name nor an email (the
 * test backend, for one), so the dropdown keeps its old label-less shape.
 */
export function selectUserIdentity(user?: User): UserIdentity | undefined {
  if (!user) {
    return undefined;
  }

  const label = user.name || user.login || user.email;
  if (!label) {
    return undefined;
  }

  return {
    label,
    ...(user.email && user.email !== label && { email: user.email }),
  };
}
