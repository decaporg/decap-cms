import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { Layout, Panel, NavDrawer } from 'react-toolbox/lib/layout';
import { Navigation } from 'react-toolbox/lib/navigation';
import { Link } from 'react-toolbox/lib/link';
import { Notifs } from 'redux-notifications';
import TopBarProgress from 'react-topbar-progress-indicator';
import { loadConfig } from '../actions/config';
import { loginUser } from '../actions/auth';
import { currentBackend } from '../backends/backend';
import {
  SHOW_COLLECTION,
  CREATE_COLLECTION,
  HELP,
  runCommand,
  navigateToCollection,
  createNewEntryInCollection,
} from '../actions/findbar';
import AppHeader from '../components/AppHeader/AppHeader';
import { Loader, Toast } from '../components/UI/index';
import styles from './App.css';

TopBarProgress.config({
  barColors: {
    0: '#3ab7a5',
    '1.0': '#3ab7a5',
  },
  shadowBlur: 5,
  shadowColor: '#3ab7a5',
  barThickness: 2,
});

class App extends React.Component {

  static propTypes = {
    auth: ImmutablePropTypes.map,
    children: PropTypes.node,
    config: ImmutablePropTypes.map,
    collections: ImmutablePropTypes.orderedMap,
    createNewEntryInCollection: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    navigateToCollection: PropTypes.func.isRequired,
    user: ImmutablePropTypes.map,
    runCommand: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
  };

  static configError(config) {
    return (<div>
      <h1>Error loading the CMS configuration</h1>

      <div>
        <p>The <code>config.yml</code> file could not be loaded or failed to parse properly.</p>
        <p><strong>Error message:</strong> {config.get('error')}</p>
      </div>
    </div>);
  }

  state = {
    navDrawerIsVisible: true,
  };

  componentDidMount() {
    this.props.dispatch(loadConfig());
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

    return (
      <div>
        {
          React.createElement(backend.authComponent(), {
            onLogin: this.handleLogin.bind(this),
            error: auth && auth.get('error'),
            isFetching: auth && auth.get('isFetching'),
          })
        }
      </div>
    );
  }

  generateFindBarCommands() {
    // Generate command list
    const commands = [];
    const defaultCommands = [];

    this.props.collections.forEach((collection) => {
      commands.push({
        id: `show_${ collection.get('name') }`,
        pattern: `Show ${ pluralize(collection.get('label')) }`,
        type: SHOW_COLLECTION,
        payload: { collectionName: collection.get('name') },
      });

      if (defaultCommands.length < 5) defaultCommands.push(`show_${ collection.get('name') }`);

      if (collection.get('create') === true) {
        commands.push({
          id: `create_${ collection.get('name') }`,
          pattern: `Create new ${ pluralize(collection.get('label'), 1) }(:itemName as ${ pluralize(collection.get('label'), 1) } Name)`,
          type: CREATE_COLLECTION,
          payload: { collectionName: collection.get('name') },
        });
      }
    });

    commands.push({ id: HELP, type: HELP, pattern: 'Help' });
    defaultCommands.push(HELP);

    return { commands, defaultCommands };
  }

  toggleNavDrawer = () => {
    this.setState({
      navDrawerIsVisible: !this.state.navDrawerIsVisible,
    });
  };

  render() {
    const { navDrawerIsVisible } = this.state;
    const {
      user,
      config,
      children,
      collections,
      runCommand,
      navigateToCollection,
      createNewEntryInCollection,
      isFetching,
    } = this.props;

    if (config === null) {
      return null;
    }

    if (config.get('error')) {
      return App.configError(config);
    }

    if (config.get('isFetching')) {
      return <Loader active>Loading configuration...</Loader>;
    }

    if (user == null) {
      return this.authenticating();
    }

    const { commands, defaultCommands } = this.generateFindBarCommands();

    return (
      <Layout theme={styles}>
        <Notifs
          className={styles.notifsContainer}
          CustomComponent={Toast}
        />
        <NavDrawer
          active={navDrawerIsVisible}
          scrollY
          permanentAt={navDrawerIsVisible ? 'lg' : null}
          onOverlayClick={this.toggleNavDrawer} // eslint-disable-line
          theme={styles}
        >
          <nav className={styles.nav}>
            <h1 className={styles.heading}>Collections</h1>
            <Navigation type="vertical">
              {
                collections.valueSeq().map(collection =>
                  <Link
                    key={collection.get('name')}
                    onClick={navigateToCollection.bind(this, collection.get('name'))} // eslint-disable-line
                  >
                    {collection.get('label')}
                  </Link>
                )
              }
            </Navigation>
          </nav>
        </NavDrawer>
        <AppHeader
          collections={collections}
          commands={commands}
          defaultCommands={defaultCommands}
          runCommand={runCommand}
          onCreateEntryClick={createNewEntryInCollection}
          toggleNavDrawer={this.toggleNavDrawer}
        />
        <Panel scrollY>
          { isFetching && <TopBarProgress /> }
          <div className={styles.main}>
            {children}
          </div>
        </Panel>
      </Layout>
    );
  }
}

function mapStateToProps(state) {
  const { auth, config, collections, global } = state;
  const user = auth && auth.get('user');
  const { isFetching } = global;
  return { auth, config, collections, user, isFetching };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    runCommand: (type, payload) => {
      dispatch(runCommand(type, payload));
    },
    navigateToCollection: (collection) => {
      dispatch(navigateToCollection(collection));
    },
    createNewEntryInCollection: (collectionName) => {
      dispatch(createNewEntryInCollection(collectionName));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
