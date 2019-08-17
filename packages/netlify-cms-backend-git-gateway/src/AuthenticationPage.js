import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import React from 'react';
import styled from '@emotion/styled';
import { partial } from 'lodash';
import {
  AuthenticationPage,
  buttons,
  shadows,
  colors,
  colorsRaw,
  lengths,
} from 'netlify-cms-ui-default';

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
  width: 350px;
  margin-top: -80px;
`;

const AuthInput = styled.input`
  background-color: ${colorsRaw.white};
  border-radius: ${lengths.borderRadius};

  font-size: 14px;
  padding: 10px 10px;
  margin-bottom: 15px;
  margin-top: 6px;
  width: 100%;
  position: relative;
  z-index: 1;

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${colors.active};
  }
`;

const ErrorMessage = styled.p`
  color: ${colors.errorText};
`;

let component = null;

if (window.netlifyIdentity) {
  window.netlifyIdentity.on('login', user => {
    component && component.handleIdentityLogin(user);
  });
  window.netlifyIdentity.on('logout', () => {
    component && component.handleIdentityLogout();
  });
}

export default class GitGatewayAuthenticationPage extends React.Component {
  constructor(props) {
    super(props);
    component = this;
  }

  componentDidMount() {
    if (!this.loggedIn && window.netlifyIdentity && window.netlifyIdentity.currentUser()) {
      this.props.onLogin(window.netlifyIdentity.currentUser());
      window.netlifyIdentity.close();
    }
  }

  componentWillUnmount() {
    component = null;
  }

  handleIdentityLogin = user => {
    this.props.onLogin(user);
    window.netlifyIdentity.close();
  };

  handleIdentityLogout = () => {
    window.netlifyIdentity.open();
  };

  handleIdentity = () => {
    const user = window.netlifyIdentity.currentUser();
    if (user) {
      this.props.onLogin(user);
    } else {
      window.netlifyIdentity.open();
    }
  };

  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
    error: PropTypes.node,
    config: ImmutablePropTypes.map,
  };

  state = { email: '', password: '', errors: {} };

  handleChange = (name, e) => {
    this.setState({ ...this.state, [name]: e.target.value });
  };

  handleLogin = e => {
    e.preventDefault();

    const { email, password } = this.state;
    const errors = {};
    if (!email) {
      errors.email = 'Make sure to enter your email.';
    }
    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    GitGatewayAuthenticationPage.authClient
      .login(this.state.email, this.state.password, true)
      .then(user => {
        this.props.onLogin(user);
      })
      .catch(error => {
        this.setState({
          errors: { server: error.description || error.msg || error },
          loggingIn: false,
        });
      });
  };

  render() {
    const { errors } = this.state;
    const { error, inProgress, config } = this.props;

    if (window.netlifyIdentity) {
      return (
        <AuthenticationPage
          logoUrl={config.get('logo_url')}
          onLogin={this.handleIdentity}
          renderButtonContent={() => 'Login with Netlify Identity'}
        />
      );
    }

    return (
      <AuthenticationPage
        logoUrl={config.get('logo_url')}
        renderPageContent={() => (
          <AuthForm onSubmit={this.handleLogin}>
            {!error ? null : <ErrorMessage>{error}</ErrorMessage>}
            {!errors.server ? null : <ErrorMessage>{errors.server}</ErrorMessage>}
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
              {inProgress ? 'Logging in...' : 'Login'}
            </LoginButton>
          </AuthForm>
        )}
      />
    );
  }
}
