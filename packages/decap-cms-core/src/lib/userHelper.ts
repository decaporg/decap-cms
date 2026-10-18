import type { User } from 'decap-cms-lib-util';

export type UserIdentity = {
  /** Display name, or the closest thing the backend knows. */
  label: string;
  /** Shown under the label when it adds something the label doesn't. */
  email?: string;
};

/**
 * Who the editor is signed in as, for the account dropdown: a backend may log
 * them back in silently. Undefined when neither a name nor an email is known.
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
