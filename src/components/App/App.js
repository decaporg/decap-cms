import PropTypes from 'prop-types';
import React from 'react';
import { hot } from 'react-hot-loader';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { Route, Switch, Link, Redirect } from 'react-router-dom';
import { Notifs } from 'redux-notifications';
import TopBarProgress from 'react-topbar-progress-indicator';
import { loadConfig as actionLoadConfig } from 'Actions/config';
import { loginUser as actionLoginUser, logoutUser as actionLogoutUser } from 'Actions/auth';
import { currentBackend } from 'Backends/backend';
import { showCollection, createNewEntry } from 'Actions/collections';
import { openMediaLibrary as actionOpenMediaLibrary } from 'Actions/mediaLibrary';
import MediaLibrary from 'MediaLibrary/MediaLibrary';
import { Loader, Toast } from 'UI';
import { getCollectionUrl, getNewEntryUrl } from 'Lib/urlHelper';
import { SIMPLE, EDITORIAL_WORKFLOW } from 'Constants/publishModes';
import Collection from 'Collection/Collection';
import Workflow from 'Workflow/Workflow';
import Editor from 'Editor/Editor';
import NotFoundPage from './NotFoundPage';
import Header from './Header';

TopBarProgress.config({
  barColors: {
    /**
     * Uses value from CSS --colorActive.
     */
    "0": '#3a69c8',
    '1.0': '#3a69c8',
  },
  shadowBlur: 0,
  barThickness: 2,
});

class App extends React.Component {

  static propTypes = {
    auth: ImmutablePropTypes.map,
    config: ImmutablePropTypes.map,
    collections: ImmutablePropTypes.orderedMap,
    logoutUser: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    user: ImmutablePropTypes.map,
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
        <p>Check your console for details.</p>
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
        <Notifs CustomComponent={Toast} />
        {
          React.createElement(backend.authComponent(), {
            onLogin: this.handleLogin.bind(this),
            error: auth && auth.get('error'),
            isFetching: auth && auth.get('isFetching'),
            siteId: this.props.config.getIn(["backend", "site_domain"]),
            base_url: this.props.config.getIn(["backend", "base_url"], null),
            authEndpoint: this.props.config.getIn(["backend", "auth_endpoint"]),
            config: this.props.config,
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
      logoutUser,
      isFetching,
      publishMode,
      openMediaLibrary,
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

    const defaultPath = `/collections/${collections.first().get('name')}`;
    const hasWorkflow = publishMode === EDITORIAL_WORKFLOW;

    return (
      <div className="nc-app-container">
        <Notifs CustomComponent={Toast} />
        <Header
          user={user}
          collections={collections}
          onCreateEntryClick={createNewEntry}
          onLogoutClick={logoutUser}
          openMediaLibrary={openMediaLibrary}
          hasWorkflow={hasWorkflow}
          displayUrl={config.get('display_url')}
        />
        <div className="nc-app-main">
          { isFetching && <TopBarProgress /> }
          <div>
            <Switch>
              <Redirect exact from="/" to={defaultPath} />
              <Redirect exact from="/search/" to={defaultPath} />
              { hasWorkflow ? <Route path="/workflow" component={Workflow}/> : null }
              <Route exact path="/collections/:name" component={Collection} />
              <Route path="/collections/:name/new" render={props => <Editor {...props} newRecord />} />
              <Route path="/collections/:name/entries/:slug" component={Editor} />
              <Route path="/search/:searchTerm" render={props => <Collection {...props} isSearchResults />} />
              <Route component={NotFoundPage} />
            </Switch>
            <MediaLibrary/>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { auth, config, collections, globalUI } = state;
  const user = auth && auth.get('user');
  const isFetching = globalUI.get('isFetching');
  const publishMode = config && config.get('publish_mode');
  return { auth, config, collections, user, isFetching, publishMode };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    openMediaLibrary: () => {
      dispatch(actionOpenMediaLibrary());
    },
    logoutUser: () => {
      dispatch(actionLogoutUser());
    },
  };
}

export default hot(module)(
  connect(mapStateToProps, mapDispatchToProps)(App)
);
