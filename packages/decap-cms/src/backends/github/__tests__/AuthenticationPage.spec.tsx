import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import GitHubAuthenticationPage from '@/backends/github/AuthenticationPage';

import type GitHub from '@/backends/github/implementation';

// The Netlify OAuth popup, answering with what a successful login returns.
const oauthResult = { token: 'gho_from_popup', provider: 'github' };
vi.mock('@/lib/auth/index', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  NetlifyAuthenticator: class {
    authenticate(_options: unknown, callback: (error: null, data: typeof oauthResult) => void) {
      callback(null, oauthResult);
    }
  },
}));

const t = (key: string) => key;

function makeBackend(patAuth: boolean, openAuthoring = false): GitHub {
  return {
    authenticateWithFork: vi.fn().mockResolvedValue(undefined),
    config: {
      site_url: undefined,
      backend: {
        open_authoring: openAuthoring,
        auth_scope: '',
        pat_auth: patAuth,
      },
    },
  } as unknown as GitHub;
}

describe('GitHubAuthenticationPage - personal access token login (DCMS-1400)', () => {
  it('does not render a token form when pat_auth is not configured', () => {
    render(<GitHubAuthenticationPage backend={makeBackend(false)} t={t} />);

    expect(screen.queryByPlaceholderText('ghp_... or github_pat_...')).toBeNull();
  });

  it('renders a token form alongside the OAuth button when pat_auth is enabled', () => {
    render(<GitHubAuthenticationPage backend={makeBackend(true)} t={t} />);

    expect(screen.getByPlaceholderText('ghp_... or github_pat_...')).toBeTruthy();
    // The OAuth button is still offered - PAT is additive, not a replacement.
    expect(screen.getByText('auth.loginWithGitHub')).toBeTruthy();
  });

  it('calls onLogin with the pasted token, bypassing the OAuth popup flow', () => {
    const onLogin = vi.fn();
    render(<GitHubAuthenticationPage backend={makeBackend(true)} onLogin={onLogin} t={t} />);

    fireEvent.change(screen.getByPlaceholderText('ghp_... or github_pat_...'), {
      target: { value: 'ghp_abc123' },
    });
    fireEvent.submit(screen.getByText('auth.loginWithToken').closest('form')!);

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith({ token: 'ghp_abc123' });
  });
});

describe('GitHubAuthenticationPage - OAuth login', () => {
  it('passes the OAuth result, with its token, to onLogin', () => {
    // Regression: onLogin was called with nothing, so the backend read
    // `credentials.token` off undefined and every OAuth login failed.
    const onLogin = vi.fn();
    render(<GitHubAuthenticationPage backend={makeBackend(false)} onLogin={onLogin} t={t} />);

    fireEvent.click(screen.getByText('auth.loginWithGitHub'));

    expect(onLogin).toHaveBeenCalledWith(oauthResult);
  });

  it('passes the OAuth result on after finding the fork with open authoring', async () => {
    const onLogin = vi.fn();
    const backend = makeBackend(false, true);
    render(<GitHubAuthenticationPage backend={backend} onLogin={onLogin} t={t} />);

    fireEvent.click(screen.getByText('auth.loginWithGitHub'));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(oauthResult));
    expect(backend.authenticateWithFork).toHaveBeenCalledWith(expect.objectContaining({ userData: oauthResult }));
  });
});
