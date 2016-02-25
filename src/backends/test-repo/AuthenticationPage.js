import React from 'react';

export default class AuthenticationPage extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {email: ''};
    this.handleLogin = this.handleLogin.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
  }

  handleLogin() {
    this.props.onLogin(this.state);
  }

  handleEmailChange(e) {
    this.setState({email: e.target.value});
  }

  render() {
    return <div>
      <p>
        <label>Your name or email: <input type='text' onChange={this.handleEmailChange}/></label>
      </p>
      <p>
        <button onClick={this.handleLogin}>Login</button>
      </p>
    </div>;
  }
}
