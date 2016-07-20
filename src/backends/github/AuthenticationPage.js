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
    let auth;
    if (document.location.host.split(':')[0] === 'localhost') {
      auth = new Authenticator({ site_id: 'cms.netlify.com' });
    } else {
      auth = new Authenticator();
    }

    auth.authenticate({provider: 'github', scope: 'repo'}, (err, data) => {
      if (err) {
        this.setState({loginError: err.toString()});
        return;
      }
      this.props.onLogin(data);
    });
  }

  render() {
    const { loginError } = this.state;

    return <div>
      {loginError && <p>{loginError}</p>}
      <p><a href="#" onClick={this.handleLogin}>Login with GitHub</a></p>
    </div>;
  }
}
