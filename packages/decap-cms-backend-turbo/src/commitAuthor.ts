import type { CommitAuthor } from 'decap-cms-backend-github/src/API';

type SupabaseUserMetadata = {
  display_name?: string;
  full_name?: string;
  name?: string;
};

type CommitAuthorInput = {
  user_name?: string;
  user_email?: string;
  email?: string;
  user_metadata?: SupabaseUserMetadata;
};

function getEmailLocalPart(email: string) {
  return email.split('@')[0] || email;
}

export function resolveCommitAuthorFromSupabaseUser(
  user: CommitAuthorInput,
  emailFallback?: string,
): CommitAuthor | undefined {
  const email = user.user_email || user.email || emailFallback;
  if (!email) {
    return undefined;
  }

  const displayName = user.user_name || user.user_metadata?.display_name;
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  const name = displayName || fullName || getEmailLocalPart(email);

  return {
    name,
    email,
  };
}
