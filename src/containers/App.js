import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { IndexLink } from "react-router";
import FontIcon from 'react-toolbox/lib/font_icon';
import { Layout, Panel } from 'react-toolbox/lib/layout';
import { Navigation } from 'react-toolbox/lib/navigation';
import { Notifs } from 'redux-notifications';
import TopBarProgress from 'react-topbar-progress-indicator';
import Sidebar from './Sidebar';
import { loadConfig as actionLoadConfig } from '../actions/config';
import { loginUser as actionLoginUser, logoutUser as actionLogoutUser } from '../actions/auth';
import { toggleSidebar as actionToggleSidebar } from '../actions/globalUI';
import { currentBackend } from '../backends/backend';
import {
  runCommand as actionRunCommand,
  navigateToCollection as actionNavigateToCollection,
  createNewEntryInCollection as actionCreateNewEntryInCollection,
} from '../actions/findbar';
import AppHeader from '../components/AppHeader/AppHeader';
import { Loader, Toast } from '../components/UI/index';
import { getCollectionUrl, getNewEntryUrl } from '../lib/urlHelper';
import { SIMPLE, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import styles from './App.css';
import sidebarStyles from './Sidebar.css';

TopBarProgress.config({
  barColors: {
    "0": '#3ab7a5',
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
    logoutUser: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    navigateToCollection: PropTypes.func.isRequired,
    user: ImmutablePropTypes.map,
    runCommand: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    publishMode: PropTypes.oneOf([SIMPLE, EDITORIAL_WORKFLOW]),
    siteId: PropTypes.string,
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

  componentDidMount() {
    this.props.dispatch(actionLoadConfig());
  }

  handleLogin(credentials) {
    this.props.dispatch(actionLoginUser(credentials));
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
            siteId: this.props.config.getIn(["backend", "site_domain"]),
            base_url: this.props.config.getIn(["backend", "base_url"], null)
          })
        }
      </div>
    );
  }

  handleLinkClick(event, handler, ...args) {
    event.preventDefault();
    handler(...args);
  }

  render() {
    const {
      user,
      config,
      children,
      collections,
      toggleSidebar,
      runCommand,
      navigateToCollection,
      createNewEntryInCollection,
      logoutUser,
      isFetching,
      publishMode,
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

    const sidebarContent = (
      <div>
        <Navigation type="vertical" className={sidebarStyles.nav}>
          {
            publishMode === SIMPLE ? null :
            <section>
              <h1 className={sidebarStyles.heading}>Publishing</h1>
              <div className={sidebarStyles.linkWrapper}>
                <IndexLink to="/" className={sidebarStyles.viewEntriesLink}>Editorial Workflow</IndexLink>
              </div>
            </section>
          }
          <section>
            <h1 className={sidebarStyles.heading}>Collections</h1>
            {
              collections.valueSeq().map((collection) => {
                const collectionName = collection.get('name');
                return (
                  <div key={collectionName} className={sidebarStyles.linkWrapper}>
                    <a
                      href={getCollectionUrl(collectionName, true)}
                      className={sidebarStyles.viewEntriesLink}
                      onClick={e => this.handleLinkClick(e, navigateToCollection, collectionName)}
                    >
                      {pluralize(collection.get('label'))}
                    </a>
                    {
                      collection.get('create') ? (
                        <a
                          href={getNewEntryUrl(collectionName, true)}
                          className={sidebarStyles.createEntryLink}
                          onClick={e => this.handleLinkClick(e, createNewEntryInCollection, collectionName)}
                        >
                          <FontIcon value="add_circle_outline" />
                        </a>
                      ) : null
                    }
                  </div>
                );
              })
            }
          </section>
        </Navigation>
      </div>
    );

    return (
      <Sidebar content={sidebarContent}>
        <Layout>
          <Notifs CustomComponent={Toast} />
          <AppHeader
            user={user}
            collections={collections}
            runCommand={runCommand}
            onCreateEntryClick={createNewEntryInCollection}
            onLogoutClick={logoutUser}
            toggleDrawer={toggleSidebar}
          />
          <Panel scrollY className={styles.entriesPanel}>
            { isFetching && <TopBarProgress /> }
            <div>
              {children}
            </div>
          </Panel>

        </Layout>
      </Sidebar>
    );
  }
}

function mapStateToProps(state) {
  const { auth, config, collections, globalUI } = state;
  const user = auth && auth.get('user');
  const isFetching = globalUI.get('isFetching');
  const publishMode = config && config.get('publish_mode');
  return { auth, config, collections, user, isFetching, publishMode };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    toggleSidebar: () => dispatch(actionToggleSidebar()),
    runCommand: (type, payload) => {
      dispatch(actionRunCommand(type, payload));
    },
    navigateToCollection: (collection) => {
      dispatch(actionNavigateToCollection(collection));
    },
    createNewEntryInCollection: (collectionName) => {
      dispatch(actionCreateNewEntryInCollection(collectionName));
    },
    logoutUser: () => {
      dispatch(actionLogoutUser());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
