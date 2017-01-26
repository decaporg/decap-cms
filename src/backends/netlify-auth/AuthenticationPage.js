import React from "react";
import Input from "react-toolbox/lib/input";
import Button from "react-toolbox/lib/button";
import { Card, Icon } from "../../components/UI";
import logo from "./netlify_logo.svg";
import styles from "./AuthenticationPage.css";

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired,
  };

  state = { username: "", password: "", errors: {} };
  

  handleChange = (name, value) => {
    this.setState({ ...this.state, [name]: value });
  };

  handleLogin = (e) => {
    e.preventDefault();

    const { username, password } = this.state;
    const errors = {};
    if (!username) {
      errors.username = 'Make sure to enter your user name';
    }
    if (!password) {
      errors.password = 'Please enter your password';
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    AuthenticationPage.authClient.login(this.state.username, this.state.password, true)
    .then((user) => {
      this.props.onLogin(user);
    })
    .catch((error) => { 
      this.setState({ errors: { server: error.description || error.msg || error }, loggingIn: false });
    });
  };

  render() {
    const { errors } = this.state;
    const { error } = this.props;
    return (
      <section className={styles.root}>
        <Card className={styles.card}>
          <img src={logo} width={100} role="presentation" />
          {error && <p>
            <span className={styles.errorMsg}>{error}</span>
          </p>}
          {errors.server && <p>
            <span className={styles.errorMsg}>{errors.server}</span>
          </p>}
          <Input 
            type="text"
            label="Username"
            name="username"
            value={this.state.username}
            error={errors.username}
            onChange={this.handleChange.bind(this, "username")} // eslint-disable-line
          />
          <Input
            type="password"
            label="Password"
            name="password"
            value={this.state.password}
            error={errors.password}
            onChange={this.handleChange.bind(this, "password")} // eslint-disable-line
          />
          <Button
            className={styles.button}
            raised
            onClick={this.handleLogin}
          >
            <Icon type="login" /> Login
          </Button>
        </Card>
      </section>
    );
  }
}
