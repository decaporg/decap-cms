import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { Route, Switch, Link } from 'react-router-dom';
import FontIcon from 'react-toolbox/lib/font_icon';
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
import DashboardPage from './DashboardPage';
import CollectionPage from './CollectionPage';
import EntryPage from './EntryPage';
import SearchPage from './SearchPage';
import NotFoundPage from './NotFoundPage';


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
        <Navigation type="vertical" className="nc-sidebar-nav">
          {
            publishMode === SIMPLE ? null :
            <section>
              <h1 className="nc-sidebar-heading">Publishing</h1>
              <div className="nc-sidebar-linkWrapper">
                <Link to="/" className="nc-sidebar-viewEntriesLink">Editorial Workflow</Link>
              </div>
            </section>
          }
          <section>
            <h1 className="nc-sidebar-heading">Collections</h1>
            {
              collections.valueSeq().map((collection) => {
                const collectionName = collection.get('name');
                return (
                  <div key={collectionName} className="nc-sidebar-linkWrapper">
                    <a
                      href={getCollectionUrl(collectionName, true)}
                      className="nc-sidebar-viewEntriesLink"
                      onClick={e => this.handleLinkClick(e, navigateToCollection, collectionName)}
                    >
                      {collection.get('label')}
                    </a>
                    {
                      collection.get('create') ? (
                        <a
                          href={getNewEntryUrl(collectionName, true)}
                          className="nc-sidebar-createEntryLink"
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
        <div>
          <Notifs CustomComponent={Toast} />
          <AppHeader
            user={user}
            collections={collections}
            runCommand={runCommand}
            onCreateEntryClick={createNewEntryInCollection}
            onLogoutClick={logoutUser}
            toggleDrawer={toggleSidebar}
          />
          <div className="nc-app-entriesPanel">
            { isFetching && <TopBarProgress /> }
            <div>
              <Switch>
                <Route exact path='/' component={DashboardPage} />
                <Route exact path="/collections/:name" component={CollectionPage} />
                <Route path="/collections/:name/entries/new" render={(props) => (<EntryPage {...props} newRecord={true}/>)} />
                <Route path="/collections/:name/entries/:slug" component={EntryPage} />
                <Route path="/search/:searchTerm" component={SearchPage} />
                <Route component={NotFoundPage} />
              </Switch>
            </div>
          </div>
        </div>
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
