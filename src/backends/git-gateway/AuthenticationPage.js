import PropTypes from 'prop-types';
import React from "react";
import Input from "react-toolbox/lib/input";
import Button from "react-toolbox/lib/button";
import { Notifs } from 'redux-notifications';
import { Toast } from '../../components/UI/index';
import { Card, Icon } from "../../components/UI";
import logo from "./netlify_logo.svg";
import { prefixer } from '../../lib/styleHelper';

const styles = prefixer('gitGatewayAuthenticationPage');

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
  };

  state = { email: "", password: "", errors: {} };

  handleChange = (name, value) => {
    this.setState({ ...this.state, [name]: value });
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
    const { error } = this.props;

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
        <Card className="nc-gitGatewayAuthenticationPage-card">
          <form onSubmit={this.handleLogin}>
            <img src={logo} width={100} role="presentation" />
            {error && <p>
              <span className="nc-gitGatewayAuthenticationPage-errorMsg">{error}</span>
            </p>}
            {errors.server && <p>
              <span className="nc-gitGatewayAuthenticationPage-errorMsg">{errors.server}</span>
            </p>}
            <Input
              type="text"
              label="Email"
              name="email"
              value={this.state.email}
              error={errors.email}
              onChange={this.handleChange.bind(this, "email")} // eslint-disable-line
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
              className="nc-gitGatewayAuthenticationPage-button"
              raised
            >
              <Icon type="login" /> Login
            </Button>
          </form>
        </Card>
      </section>
    );
  }
}
