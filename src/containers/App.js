import React from 'react';
import { connect } from 'react-redux';
import { loadConfig } from '../actions/config';
import { loginUser } from '../actions/auth';
import { currentBackend } from '../backends/backend';
import { SHOW_COLLECTION, CREATE_COLLECTION, HELP } from '../actions/findbar';
import FindBar from './FindBar';
import styles from './App.css';
import pluralize from 'pluralize';

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

  generateFindBarCommands() {
    // Generate command list
    const commands = [];
    const defaultCommands = [];

    this.props.collections.forEach(collection => {
      commands.push({
        id: `show_${collection.get('name')}`,
        pattern: `Show ${pluralize(collection.get('label'))}`,
        type: SHOW_COLLECTION,
        payload: { collectionName:collection.get('name') }
      });

      if (defaultCommands.length < 5) defaultCommands.push(`show_${collection.get('name')}`);

      if (collection.get('create') === true) {
        commands.push({
          id: `create_${collection.get('name')}`,
          pattern: `Create new ${pluralize(collection.get('label'), 1)}(:itemName as ${pluralize(collection.get('label'), 1)} Name)`,
          type: CREATE_COLLECTION,
          payload: { collectionName:collection.get('name') }
        });
      }
    });

    commands.push({ id: HELP, type: HELP, pattern: 'Help' });
    defaultCommands.push(HELP);

    return { commands, defaultCommands };
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

    const { commands, defaultCommands } = this.generateFindBarCommands();

    return (
      <div>
        <header>
          <div className={styles.alignable}>
            <FindBar
                commands={commands}
                defaultCommands={defaultCommands}
            />
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
  const { auth, config, collections } = state;
  const user = auth && auth.get('user');

  return { auth, config, collections, user };
}

export default connect(mapStateToProps)(App);
