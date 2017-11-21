import PropTypes from 'prop-types';
import React from 'react';
import logo from "../git-gateway/netlify_logo.svg";

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
  };

  handleLogin = (e) => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  render() {
    const { inProgress } = this.props;

    return (<section className="nc-gitGatewayAuthenticationPage-root">
      <div className="nc-gitGatewayAuthenticationPage-card">
        <img src={logo} width={100} role="presentation" />
        <button
          className="nc-gitGatewayAuthenticationPage-button"
          disabled={inProgress}
          onClick={this.handleLogin}
        >
          {inProgress ? "Logging in..." : "Login"}
        </button>
      </div>
    </section>);
  }
}
