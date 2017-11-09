import PropTypes from 'prop-types';
import React from 'react';
import Input from "react-toolbox/lib/input";
import Button from "react-toolbox/lib/button";
import { Card, Icon } from "../../components/UI";
import logo from "../git-gateway/netlify_logo.svg";

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
  };

  state = { email: '' };

  handleLogin = (e) => {
    e.preventDefault();
    this.props.onLogin(this.state);
  };

  handleEmailChange = (value) => {
    this.setState({ email: value });
  };

  render() {
    const { inProgress } = this.props;

    return (<section className="nc-gitGatewayAuthenticationPage-root">
      <Card className="nc-gitGatewayAuthenticationPage-card">
        <img src={logo} width={100} role="presentation" />
        <p className="nc-gitGatewayAuthenticationPage-message">This is a demo, enter your email to start</p>
        <Input
          type="text"
          label="Email"
          name="email"
          value={this.state.email}
          onChange={this.handleEmailChange}
        />
        <Button
          className="nc-gitGatewayAuthenticationPage-button"
          raised
          disabled={inProgress}
          onClick={this.handleLogin}
        >
          <Icon type="login" /> {inProgress ? "Logging in..." : "Login"}
        </Button>
      </Card>
    </section>);
  }
}
