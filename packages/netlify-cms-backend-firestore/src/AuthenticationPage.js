/* global firebase */

import React from 'react';
import PropTypes from 'prop-types';
import { AuthenticationPage } from 'netlify-cms-ui-default';

export default class FirestoreAuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
  };

  state = {};

  handleLogin = e => {
    e.preventDefault();

    if (firebase.auth().currentUser) {
      this.props.onLogin({
        token: firebase.auth().currentUser.uid,
      });
    } else {
      this.setState({ loginError: 'You are not logged in.' });
    }
  };

  renderLoginButton = () =>
    this.props.inProgress || this.state.findingFork ? (
      'Redirecting...'
    ) : (
      'Continue with Firebase'
    );

  render() {
    const { inProgress, config } = this.props;
    const { loginError, requestingFork, findingFork } = this.state;

    return (
      <AuthenticationPage
        onLogin={this.handleLogin}
        loginDisabled={inProgress || findingFork || requestingFork}
        loginErrorMessage={loginError}
        logoUrl={config.logo_url}
        siteUrl={config.site_url}
        renderButtonContent={this.renderLoginButton}
      />
    );
  }
}
