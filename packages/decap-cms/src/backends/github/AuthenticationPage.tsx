import styled from '@emotion/styled';
import React from 'react';

import { NetlifyAuthenticator, type NetlifyAuthResult } from '@/lib/auth/index';
import { AuthenticationPage, Icon, PatLoginForm } from '@/ui/default/index';

import type { CmsUser, TranslateFunction } from '@/lib/util/index';
import type GitHub from './implementation';

const LoginButtonIcon = styled(Icon)`
  margin-right: 18px;
`;

const ForkApprovalContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  flex-grow: 0.2;
`;
const ForkButtonsContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: center;
`;

interface GitHubAuthenticationPageProps {
  onLogin?: (data: NetlifyAuthResult | undefined) => void;
  inProgress?: boolean;
  base_url?: string;
  siteId?: string;
  authEndpoint?: string;
  clearHash?: (...args: unknown[]) => unknown;
  t: TranslateFunction;
  backend: GitHub;
}

export default function GitHubAuthenticationPage({
  onLogin,
  inProgress,
  base_url,
  siteId,
  authEndpoint,
  t,
  backend,
}: GitHubAuthenticationPageProps) {
  const [loginError, setLoginError] = React.useState<string | undefined>();
  const [requestingFork, setRequestingFork] = React.useState(false);
  const [findingFork, setFindingFork] = React.useState(false);
  // Resolver for the in-flight fork-permission Promise so the approve/refuse
  // buttons can resolve it.
  const forkResolverRef = React.useRef<((approved: boolean) => void) | null>(null);

  function getPermissionToFork() {
    return new Promise<boolean>(resolve => {
      forkResolverRef.current = resolve;
      setRequestingFork(true);
    });
  }

  function approveFork() {
    setRequestingFork(false);
    forkResolverRef.current?.(true);
    forkResolverRef.current = null;
  }

  function refuseFork() {
    setRequestingFork(false);
    forkResolverRef.current?.(false);
    forkResolverRef.current = null;
  }

  function loginWithOpenAuthoring(data: NetlifyAuthResult) {
    setFindingFork(true);
    return backend
      .authenticateWithFork({
        userData: data as CmsUser,
        getPermissionToFork,
      })
      .catch(err => {
        setFindingFork(false);
        console.error(err);
        throw err;
      });
  }

  function handleLogin(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const cfg = {
      base_url,
      site_id: document.location.host.split(':')[0] === 'localhost' ? 'demo.decapcms.org' : siteId,
      auth_endpoint: authEndpoint,
    };
    const auth = new NetlifyAuthenticator(cfg);

    const config = backend.config;
    const { open_authoring: openAuthoring = false, auth_scope: authScope = '' } = config.backend;

    const scope = authScope || (openAuthoring ? 'public_repo' : 'repo');
    auth.authenticate({ provider: 'github', scope }, (err, data) => {
      if (err) {
        setLoginError(err.toString());
        return;
      }
      // The OAuth result carries the token, so it must reach onLogin: the
      // backend authenticates with it.
      if (openAuthoring) {
        return loginWithOpenAuthoring(data!).then(() => onLogin?.(data));
      }
      onLogin?.(data);
    });
  }

  function handlePatLogin(token: string) {
    onLogin?.({ token });
  }

  function renderLoginButton() {
    return inProgress || findingFork
      ? (
        t('auth.loggingIn')
      )
      : (
        <React.Fragment>
          <LoginButtonIcon type="github" />
          {t('auth.loginWithGitHub')}
        </React.Fragment>
      );
  }

  function getAuthenticationPageRenderArgs() {
    if (requestingFork) {
      return {
        renderPageContent: ({
          LoginButton,
          TextButton,
          showAbortButton,
        }: {
          LoginButton: React.FC<React.PropsWithChildren & { onClick: (() => void) | undefined }>,
          TextButton: React.FC<React.PropsWithChildren & { onClick: (() => void) | undefined }>,
          showAbortButton: boolean,
        }) => (
          <ForkApprovalContainer>
            <p>
              Open Authoring is enabled: we need to use a fork on your github account. (If a fork already exists,
              we&#39;ll use that.)
            </p>
            <ForkButtonsContainer>
              <LoginButton onClick={approveFork}>Fork the repo</LoginButton>
              {showAbortButton && <TextButton onClick={refuseFork}>Don&#39;t fork the repo</TextButton>}
            </ForkButtonsContainer>
          </ForkApprovalContainer>
        ),
      };
    }

    return {
      renderButtonContent: renderLoginButton,
      renderPageContent: backend.config.backend.pat_auth
        ? () => (
          <PatLoginForm
            onSubmit={handlePatLogin}
            disabled={inProgress || findingFork}
            t={t}
            placeholder="ghp_... or github_pat_..."
          />
        )
        : undefined,
    };
  }

  const config = backend.config;
  return (
    <AuthenticationPage
      onLogin={handleLogin}
      loginDisabled={inProgress || findingFork || requestingFork}
      loginErrorMessage={loginError}
      siteUrl={config.site_url}
      {...getAuthenticationPageRenderArgs()}
      t={t}
    />
  );
}
