import PropTypes from 'prop-types';
import React from 'react';
import { partial } from 'lodash';
import { Icon } from "UI";

let component = null;

const localHosts = {
  localhost: true,
  "127.0.0.1": true,
  "0.0.0.0": true
};

export default class AuthenticationPage extends React.Component {
  constructor(props) {
    super(props);
    component = this;
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    component = null;
  }

  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool,
  };

  state = { email: "", password: "", errors: {} };

  handleChange = (name, e) => {
    this.setState({ ...this.state, [name]: e.target.value });
  };

  handleLogin = (e) => {
    e.preventDefault();

    const { email, password } = this.state;
    const errors = {};

    if (localHosts[document.location.host.split(":").shift()]) {
      this.props.onLogin(this.state);
    } else {
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
      AuthenticationPage.authClient.login(this.state.email, this.state.password, true)
      .then((user) => {
        this.props.onLogin(user);
      })
      .catch((error) => {
        this.setState({ errors: { server: error.description || error.msg || error }, loggingIn: false });
      });
    }
  };

  render() {
    const { errors } = this.state;
    const { error, inProgress } = this.props;

    return (
      <section className="nc-filesystemAuthenticationPage-root">
        <Icon className="nc-filesystemAuthenticationPage-logo" size="500px" type="netlify-cms"/>
        <form className="nc-filesystemAuthenticationPage-form" onSubmit={this.handleLogin}>
          {!error && <p>
            <span className="nc-filesystemAuthenticationPage-errorMsg">{error}</span>
          </p>}
          {!errors.server && <p>
            <span className="nc-filesystemAuthenticationPage-errorMsg">{errors.server}</span>
          </p>}
          <div className="nc-filesystemAuthenticationPage-errorMsg">{ errors.email || null }</div>
          <input
            type="text"
            name="email"
            placeholder="Email"
            value={this.state.email}
            onChange={partial(this.handleChange, 'email')}
          />
          <div className="nc-filesystemAuthenticationPage-errorMsg">{ errors.password || null }</div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={this.state.password}
            onChange={partial(this.handleChange, 'password')}
          />
          <button
            className="nc-filesystemAuthenticationPage-button"
            disabled={inProgress}
            onClick={this.handleLogin}
            >
            {inProgress ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    );
  }
}
