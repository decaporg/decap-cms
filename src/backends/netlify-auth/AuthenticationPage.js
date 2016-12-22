import React from 'react';
import Input from 'react-toolbox/lib/input';
import Button from 'react-toolbox/lib/button';
import { Card, Icon } from '../../components/UI';
import logo from './netlify_logo.svg';
import styles from './AuthenticationPage.css';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired,
  };

  state = { username: '', password: '' };

  handleChange = (name, value) => {
    this.setState({ ...this.state, [name]: value });
  };

  handleLogin = (e) => {
    e.preventDefault();
    AuthenticationPage.authClient.login(this.state.username, this.state.password, true)
    .then(user => {
      this.props.onLogin(user);
    })
    .catch(err => {throw err});
  };

  render() {
    const { loginError } = this.state;

    return (
      <section className={styles.root}>
        {loginError && <p>{loginError}</p>}

        <Card className={styles.card}>
          <img src={logo} width={100} />
          <Input type="text" label="Username" name="username" value={this.state.username} onChange={this.handleChange.bind(this, 'username')} />
          <Input type="password" label="Password" name="password" value={this.state.password} onChange={this.handleChange.bind(this, 'password')} />
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
