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

// Login happens in a popup pointed at the Turbo admin app, which posts the
// resulting Supabase session back via `window.postMessage`. Only messages
// whose `event.origin` matches the configured `turbo_admin_url` origin are
// accepted (see `handlePopupMessage`) — this is the security boundary for the
// whole flow, so it must never be relaxed (e.g. to `*`) when changing this.
function credentialsFromPostMessageData(data) {
  if (!data || data.source !== POPUP_MESSAGE_SOURCE) return null;
  const { credentials } = data;
  if (!credentials || !credentials.access_token || !credentials.refresh_token) return null;

  let userMetadata = {};
  if (credentials.user_metadata) {
    try {
      userMetadata = JSON.parse(atob(credentials.user_metadata));
    } catch {
      userMetadata = {};
    }
  }

  return {
    token: credentials.access_token,
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expires_at: Number(credentials.expires_at) || undefined,
    provider_token: credentials.access_token,
    user_email: credentials.user_email || undefined,
    email: credentials.user_email || undefined,
    user_name: credentials.user_name || undefined,
    user_metadata: userMetadata,
  };
}

export default class SupabaseAuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
    error: PropTypes.node,
    config: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
  }

  state = { popupError: null, popupBlocked: false };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(
      SupabaseAuthenticationPage.propTypes,
      this.props,
      'prop',
      'SupabaseAuthenticationPage',
    );

    window.addEventListener('message', this.handlePopupMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handlePopupMessage);
    this.stopWatchingPopup();
  }

  getTurboAdminOrigin = () => {
    const { turbo_admin_url: turboAdminUrl = DEFAULT_TURBO_ADMIN_URL } = this.props.config.backend;
    return new URL(turboAdminUrl).origin;
  };

  getTurboLoginUrl = () => {
    const { turbo_admin_url: turboAdminUrl = DEFAULT_TURBO_ADMIN_URL } = this.props.config.backend;
    const redirectTo = `${window.location.origin}${window.location.pathname}?popup=1`;
    return `${turboAdminUrl.replace(/\/$/, '')}/login?redirect_to=${encodeURIComponent(
      redirectTo,
    )}`;
  };

  handlePopupMessage = event => {
    if (event.origin !== this.getTurboAdminOrigin()) return;

    const credentials = credentialsFromPostMessageData(event.data);
    if (!credentials) return;

    this.stopWatchingPopup();
    this.setState({ popupError: null, popupBlocked: false });
    this.props.onLogin(credentials);
  };

  stopWatchingPopup = () => {
    if (this.popupWatcher) {
      clearInterval(this.popupWatcher);
      this.popupWatcher = null;
    }
  };

  handleTurboLogin = () => {
    this.setState({ popupError: null, popupBlocked: false });

    const popup = window.open(this.getTurboLoginUrl(), 'decap-turbo-login', 'width=480,height=640');
    if (!popup) {
      this.setState({ popupBlocked: true });
      return;
    }

    this.stopWatchingPopup();
    // No message is guaranteed if the user just closes the popup without
    // completing login — watch for that so the UI doesn't hang silently.
    this.popupWatcher = setInterval(() => {
      if (popup.closed) {
        this.stopWatchingPopup();
        this.setState(current =>
          current.popupError || current.popupBlocked
            ? current
            : { popupError: 'Login was cancelled.' },
        );
      }
    }, 500);
  };

  render() {
    const { popupError, popupBlocked } = this.state;
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
