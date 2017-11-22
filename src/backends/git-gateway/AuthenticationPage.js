import PropTypes from 'prop-types';
import React from "react";
import { partial } from 'lodash';
import { Notifs } from 'redux-notifications';
import { Toast } from '../../UI/index';
import Icon from '../../icons/Icon';

let component = null;

if (window.netlifyIdentity) {
  window.netlifyIdentity.on('login', (user) => {
    component && component.handleIdentityLogin(user);
  });
  window.netlifyIdentity.on('logout', () => {
    component && component.handleIdentityLogout();
  });
}

export default class AuthenticationPage extends React.Component {
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

  handleIdentityLogin = (user) => {
    this.props.onLogin(user);
    window.netlifyIdentity.close();
  }

  handleIdentityLogout = () => {
    window.netlifyIdentity.open();
  }

  handleIdentity = () => {
    if (window.netlifyIdentity.currentUser()) {
      this.props.onLogin(user);
    } else {
      window.netlifyIdentity.open();
    }
  }

  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    inProgress: PropTypes.bool.isRequired,
  };

  state = { email: "", password: "", errors: {} };

  handleChange = (name, e) => {
    this.setState({ ...this.state, [name]: e.target.value });
  };

  handleLogin = (e) => {
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

    AuthenticationPage.authClient.login(this.state.email, this.state.password, true)
    .then((user) => {
      this.props.onLogin(user);
    })
    .catch((error) => {
      this.setState({ errors: { server: error.description || error.msg || error }, loggingIn: false });
    });
  };

  render() {
    const { errors } = this.state;
    const { error, inProgress } = this.props;

    if (window.netlifyIdentity) {
      return <section className="nc-gitGatewayAuthenticationPage-root">
        <Notifs CustomComponent={Toast} />
        <Button className="nc-gitGatewayAuthenticationPage-button" raised onClick={this.handleIdentity}>
          Login with Netlify Identity
        </Button>
      </section>
    }

    return (
      <section className="nc-gitGatewayAuthenticationPage-root">
        <div className="nc-gitGatewayAuthenticationPage-card">
          <form onSubmit={this.handleLogin}>
            <div className="nc-gitGatewayAuthenticationPage-iconContainer">
              <Icon type="netlify" size="140px"/>
            </div>
            {error && <p>
              <span className="nc-gitGatewayAuthenticationPage-errorMsg">{error}</span>
            </p>}
            {errors.server && <p>
              <span className="nc-gitGatewayAuthenticationPage-errorMsg">{errors.server}</span>
            </p>}
            <label>Email</label>
            <input
              type="text"
              name="email"
              value={this.state.email}
              onChange={partial(this.handleChange, 'email')}
            />
            <div>{ errors.email || null }</div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={this.state.password}
              onChange={partial(this.handleChange, 'password')}
            />
            <div>{ errors.password || null }</div>
            <button className="nc-gitGatewayAuthenticationPage-button" disabled={inProgress}>
              {inProgress ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    );
  }
}
