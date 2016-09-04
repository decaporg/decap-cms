import React from 'react';
import Authenticator from '../../lib/netlify-auth';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {};
    this.handleLogin = this.handleLogin.bind(this);
  }

  handleLogin(e) {
    e.preventDefault();
    const {email, password} = this.state;
    this.setState({authenticating: true});
    fetch(`${AuthenticationPage.url}/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${email}:${password}`)
      }
    }).then((response) => {
      console.log(response);
      if (response.ok) {
        return response.json().then((data) => {
          this.props.onLogin(Object.assign({email}, data));
        });
      }
      response.json().then((data) => {
        this.setState({loginError: data.msg});
      })
    })
  }

  handleChange(key) {
    return (e) => {
      this.setState({[key]: e.target.value});
    };
  }

  render() {
    const { loginError } = this.state;

    return <form onSubmit={this.handleLogin}>
      {loginError && <p>{loginError}</p>}
      <p>
        <label>Your Email: <input type="email" onChange={this.handleChange('email')}/></label>
      </p>
      <p>
        <label>Your Password: <input type="password" onChange={this.handleChange('password')}/></label>
      </p>
      <p>
        <button>Login</button>
      </p>
    </form>;
  }
}
