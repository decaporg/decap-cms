import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import { AuthenticationPage, buttons, shadows, colors, Loader } from 'decap-cms-ui-default';

const ErrorMessage = styled.p`
  color: ${colors.errorText};
`;

const TurboLoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
  display: block;
  width: 100%;
  max-width: 350px;
  box-sizing: border-box;
  text-align: center;
`;

const DEFAULT_TURBO_ADMIN_URL = 'https://turbo.decapcms.org';

const POPUP_MESSAGE_SOURCE = 'decap-turbo-login';

// Turbo base64-encodes the UTF-8 JSON, and atob alone returns one character
// per byte, which garbles any non-ASCII name.
function decodeBase64Json(encoded) {
  const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// The field set both the popup message and the code exchange deliver.
function credentialsFromFlatParams(credentials) {
  if (!credentials || !credentials.access_token || !credentials.refresh_token) return null;

  let userMetadata = {};
  if (credentials.user_metadata) {
    try {
      userMetadata = decodeBase64Json(credentials.user_metadata);
    } catch {
      userMetadata = {};
    }
  }

  return {
    token: credentials.access_token,
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expires_at: Number(credentials.expires_at) || undefined,
    user_email: credentials.user_email || undefined,
    email: credentials.user_email || undefined,
    user_name: credentials.user_name || undefined,
    user_metadata: userMetadata,
    // '1' when Turbo minted this session for this CMS alone, so the backend's
    // logout may revoke it. Absent from older Turbo deploys: treated as shared.
    dedicated_session: credentials.dedicated_session === '1',
  };
}

// Login happens in a popup pointed at the Turbo admin app, which posts the
// resulting Supabase session back via `window.postMessage`. Only messages
// whose `event.origin` matches the configured `turbo_admin_url` origin are
// accepted (see `handlePopupMessage`) — this is the security boundary for the
// whole flow, so it must never be relaxed (e.g. to `*`) when changing this.
function credentialsFromPostMessageData(data) {
  if (!data || data.source !== POPUP_MESSAGE_SOURCE) return null;
  return credentialsFromFlatParams(data.credentials);
}

// Direct links from the Turbo profile page put a one-time exchange code (never
// the tokens) in the HashRouter fragment: "#/?turbo_exchange_code=...&site_id=...".
function exchangeParamsFromLocationHash(hash) {
  const searchIndex = hash.indexOf('?');
  if (searchIndex === -1) return null;

  const params = new URLSearchParams(hash.slice(searchIndex + 1));
  const code = params.get('turbo_exchange_code');
  const siteId = params.get('site_id');
  if (!code || !siteId) return null;

  return { code, siteId };
}

export default class SupabaseAuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
    error: PropTypes.node,
    config: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    clearHash: PropTypes.func,
  };

  constructor(props) {
    super(props);
  }

  state = { popupError: null, popupBlocked: false, exchangeError: null };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(
      SupabaseAuthenticationPage.propTypes,
      this.props,
      'prop',
      'SupabaseAuthenticationPage',
    );

    window.addEventListener('message', this.handlePopupMessage);

    const exchangeParams = exchangeParamsFromLocationHash(window.location.hash);
    if (exchangeParams) {
      // Single-use, and the HashRouter must not see it.
      this.props.clearHash?.();
      this.exchangeCodeForCredentials(exchangeParams);
    }
  }

  // Redeems the one-time code for the session tokens in a POST body, never a URL.
  exchangeCodeForCredentials = async ({ code, siteId }) => {
    const { turbo_admin_url: turboAdminUrl = DEFAULT_TURBO_ADMIN_URL } = this.props.config.backend;
    // site_id is repeated as a query param (in addition to the POST body)
    // because the CORS preflight (OPTIONS) carries no body — the server needs
    // it there to decide which site's admin_interface_url to check the
    // request's Origin against before allowing the real POST through.
    const exchangeUrl = `${turboAdminUrl.replace(
      /\/$/,
      '',
    )}/auth/exchange?site_id=${encodeURIComponent(siteId)}`;

    try {
      const response = await fetch(exchangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, site_id: siteId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        this.setState({ exchangeError: 'This login link has expired. Please try again.' });
        return;
      }

      const credentials = credentialsFromFlatParams(result.credentials);
      if (!credentials) {
        this.setState({ exchangeError: 'This login link has expired. Please try again.' });
        return;
      }

      this.props.onLogin(credentials);
    } catch {
      this.setState({
        exchangeError: 'Could not reach Turbo to complete login. Please try again.',
      });
    }
  };

  componentWillUnmount() {
    window.removeEventListener('message', this.handlePopupMessage);
    this.stopWatchingPopup();
    this.closePopup();
  }

  getTurboAdminOrigin = () => {
    const { turbo_admin_url: turboAdminUrl = DEFAULT_TURBO_ADMIN_URL } = this.props.config.backend;
    return new URL(turboAdminUrl).origin;
  };

  getTurboLoginUrl = () => {
    const { turbo_admin_url: turboAdminUrl = DEFAULT_TURBO_ADMIN_URL, turbo_site_id: siteId } =
      this.props.config.backend;
    const redirectTo = `${window.location.origin}${window.location.pathname}?popup=1`;
    // The site lets Turbo check that the signed-in user is a member of the
    // site this origin belongs to before it mints a session for it.
    const siteParam = siteId ? `&site_id=${encodeURIComponent(siteId)}` : '';
    return `${turboAdminUrl.replace(
      /\/$/,
      '',
    )}/auth/decap-redirect?redirect_to=${encodeURIComponent(redirectTo)}${siteParam}`;
  };

  handlePopupMessage = event => {
    if (event.origin !== this.getTurboAdminOrigin()) return;
    // Any Turbo page open in another window shares that origin; only the
    // popup this page opened may log it in.
    if (this.popup && event.source !== this.popup) return;

    const credentials = credentialsFromPostMessageData(event.data);
    if (!credentials) return;

    this.stopWatchingPopup();
    this.closePopup();
    this.setState({ popupError: null, popupBlocked: false });
    this.props.onLogin(credentials);
  };

  stopWatchingPopup = () => {
    if (this.popupWatcher) {
      clearInterval(this.popupWatcher);
      this.popupWatcher = null;
    }
  };

  closePopup = () => {
    if (this.popup && !this.popup.closed) {
      this.popup.close();
    }
    this.popup = null;
  };

  handleTurboLogin = () => {
    this.setState({ popupError: null, popupBlocked: false });

    const popup = window.open(this.getTurboLoginUrl(), 'decap-turbo-login', 'width=480,height=640');
    if (!popup) {
      this.setState({ popupBlocked: true });
      return;
    }

    this.stopWatchingPopup();
    this.popup = popup;
    // No message is guaranteed if the user just closes the popup without
    // completing login — watch for that so the UI doesn't hang silently.
    this.popupWatcher = setInterval(() => {
      if (popup.closed) {
        this.stopWatchingPopup();
        this.popup = null;
        this.setState(current =>
          current.popupError || current.popupBlocked
            ? current
            : { popupError: 'Login was cancelled.' },
        );
      }
    }, 500);
  };

  render() {
    const { popupError, popupBlocked, exchangeError } = this.state;
    const { error, inProgress, config, t } = this.props;

    if (inProgress) {
      return <Loader active>{t('auth.loggingIn')}</Loader>;
    }

    return (
      <AuthenticationPage
        logoUrl={config.logo_url} // Deprecated, replaced by `logo.src`
        logo={config.logo}
        siteUrl={config.site_url}
        renderPageContent={() => (
          <>
            {!error ? null : <ErrorMessage>{error}</ErrorMessage>}
            {!popupError ? null : <ErrorMessage>{popupError}</ErrorMessage>}
            {!exchangeError ? null : <ErrorMessage>{exchangeError}</ErrorMessage>}
            {!popupBlocked ? null : (
              <ErrorMessage>
                Your browser blocked the login popup. Please allow popups for this site and try
                again.
              </ErrorMessage>
            )}
            <TurboLoginButton onClick={this.handleTurboLogin}>Login with Turbo</TurboLoginButton>
          </>
        )}
        t={t}
      />
    );
  }
}
