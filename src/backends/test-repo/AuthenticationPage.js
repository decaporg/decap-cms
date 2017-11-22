import PropTypes from 'prop-types';
import React from 'react';
import Icon from '../../icons/Icon';

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
        <Icon type="netlify" size="large"/>
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
