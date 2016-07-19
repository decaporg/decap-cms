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

    const auth = new Authenticator({site_id: 'cms.netlify.com'});
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
