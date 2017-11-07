import PropTypes from 'prop-types';
import React from 'react';
import Input from "react-toolbox/lib/input";
import Button from "react-toolbox/lib/button";
import { Card, Icon } from "../../components/UI";
import logo from "./netlify_logo.svg";
import styles from "./AuthenticationPage.css";

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
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
    return (<section className="fs-auth-page-root">
      <Card className="fs-auth-page-card">
        <img src={logo} width={100} role="presentation" />
        <p className="fs-auth-page-message">This is a demo, enter your email (optional)</p>
        <Input
          type="text"
          label="Email"
          name="email"
          value={this.state.email}
          onChange={this.handleEmailChange}
        />
        <Button
          className="fs-auth-page-button"
          raised
          onClick={this.handleLogin}
        >
          <Icon type="login" /> Login
        </Button>
      </Card>
    </section>);
  }
}
