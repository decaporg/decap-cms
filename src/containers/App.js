import React from 'react';
import { connect } from 'react-redux';
import { loadConfig } from '../actions/config';
import { loginUser } from '../actions/auth';
import { currentBackend } from '../backends/backend';
import { LIST_POSTS, LIST_FAQ, HELP, MORE_COMMANDS } from '../actions/findbar';
import FindBar from './FindBar';
import styles from './App.css';

class App extends React.Component {
  componentDidMount() {
    this.props.dispatch(loadConfig());
  }

  configError(config) {
    return <div>
      <h1>Error loading the CMS configuration</h1>

      <div>
        <p>The "config.yml" file could not be loaded or failed to parse properly.</p>
        <p><strong>Error message:</strong> {config.get('error')}</p>
      </div>
    </div>;
  }

  configLoading() {
    return <div>
      <h1>Loading configuration...</h1>
    </div>;
  }

  handleLogin(credentials) {
    this.props.dispatch(loginUser(credentials));
  }

  authenticating() {
    const { auth } = this.props;
    const backend = currentBackend(this.props.config);

    if (backend == null) {
      return <div><h1>Waiting for backend...</h1></div>;
    }

    return <div>
      {React.createElement(backend.authComponent(), {
        onLogin: this.handleLogin.bind(this),
        error: auth && auth.get('error'),
        isFetching: auth && auth.get('isFetching')
      })}
    </div>;
  }

  render() {
    const { user, config, children } = this.props;

    if (config === null) {
      return null;
    }

    if (config.get('error')) {
      return this.configError(config);
    }

    if (config.get('isFetching')) {
      return this.configLoading();
    }

    if (user == null) {
      return this.authenticating();
    }

    return (
      <div>
        <header>
          <div className={styles.alignable}>
            <FindBar commands={[
              { id: LIST_POSTS, pattern: 'List Posts' },
              { id: LIST_FAQ, pattern: 'List FAQs' },
              { id: HELP, pattern: 'Help' },
            ]} />
          </div>
        </header>
        <div className={`${styles.alignable} ${styles.main}`}>
          {children}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { auth, config } = state;
  const user = auth && auth.get('user');

  return { auth, config, user };
}

export default connect(mapStateToProps)(App);
