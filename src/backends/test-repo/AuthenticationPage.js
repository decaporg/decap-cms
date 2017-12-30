import React from 'react';
import Input from "react-toolbox/lib/input";
import Button from "react-toolbox/lib/button";
import { Card, Icon } from "../../components/UI";
import logo from "../netlify-auth/netlify_logo.svg";
import styles from "../netlify-auth/AuthenticationPage.css";
import i18n from '../../i18n'

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired,
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
    return (<section className={styles.root}>
      <Card className={styles.card}>
        <img src={logo} width={100} role="presentation" />
        <p className={styles.message}>{i18n.t('demo_message')}</p>
        <Input
          type="text"
          label={i18n.t('email')}
          name="email"
          value={this.state.email}
          onChange={this.handleEmailChange}
        />
        <Button
          className={styles.button}
          raised
          onClick={this.handleLogin}
        >
          <Icon type="login" /> {i18n.t('login')}
        </Button>
      </Card>
    </section>);
  }
}
