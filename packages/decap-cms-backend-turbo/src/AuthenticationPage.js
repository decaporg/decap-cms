import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';
import partial from 'lodash/partial';
import {
  AuthenticationPage,
  buttons,
  shadows,
  colors,
  colorsRaw,
  lengths,
  zIndex,
  Loader,
} from 'decap-cms-ui-default';
import { createClient } from '@supabase/supabase-js';

const LoginButton = styled.button`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};

  padding: 0 30px;
  display: block;
  margin-top: 20px;
  margin-left: auto;
`;

const AuthForm = styled.form`
  max-width: 350px;
  width: 100%;
`;

const AuthInput = styled.input`
  background-color: ${colorsRaw.white};
  border-radius: ${lengths.borderRadius};

  font-size: 14px;
  padding: 10px;
  margin-bottom: 15px;
  margin-top: 6px;
  width: 100%;
  position: relative;
  z-index: ${zIndex.zIndex1};

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${colors.active};
  }
`;

const ErrorMessage = styled.p`
  color: ${colors.errorText};
`;

export default class SupabaseAuthenticationPage extends React.Component {
  static authClient;

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

  async componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(
      SupabaseAuthenticationPage.propTypes,
      this.props,
      'prop',
      'SupabaseAuthenticationPage',
    );

    const { base_url = '', anon_key = '' } = this.props.config.backend;
    this.supabase = createClient(base_url, anon_key);
  }

  state = { email: '', password: '', errors: {} };

  handleChange = (name, e) => {
    this.setState({ ...this.state, [name]: e.target.value });
  };

  handleLogin = async e => {
    e.preventDefault();

    const { email, password } = this.state;
    const { t } = this.props;
    const errors = {};
    if (!email) {
      errors.email = t('auth.errors.email');
    }
    if (!password) {
      errors.password = t('auth.errors.password');
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.state.email,
        password: this.state.password,
      });

      if (error) {
        throw error;
      }

      console.log('Supabase login data:', data);

      this.props.onLogin({
        token: data.session.access_token,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        provider_token: data.session.access_token,
        user_email: data.user?.email,
        email: data.user?.email,
        user_name:
          data.user?.user_metadata?.display_name ||
          data.user?.user_metadata?.full_name ||
          data.user?.user_metadata?.name,
        user_metadata: data.user?.user_metadata,
      });
    } catch (error) {
      this.setState({
        errors: { server: error.description || error.msg || error },
        loggingIn: false,
      });
    }
  };

  render() {
    const { errors } = this.state;
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
          <AuthForm onSubmit={this.handleLogin}>
            {!error ? null : <ErrorMessage>{error}</ErrorMessage>}
            {!errors.server ? null : <ErrorMessage>{String(errors.server)}</ErrorMessage>}
            <ErrorMessage>{errors.email || null}</ErrorMessage>
            <AuthInput
              type="text"
              name="email"
              placeholder="Email"
              value={this.state.email}
              onChange={partial(this.handleChange, 'email')}
            />
            <ErrorMessage>{errors.password || null}</ErrorMessage>
            <AuthInput
              type="password"
              name="password"
              placeholder="Password"
              value={this.state.password}
              onChange={partial(this.handleChange, 'password')}
            />
            <LoginButton disabled={inProgress}>
              {inProgress ? t('auth.loggingIn') : t('auth.login')}
            </LoginButton>
          </AuthForm>
        )}
        t={t}
      />
    );
  }
}
