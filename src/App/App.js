import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { Route, Switch, Link, Redirect } from 'react-router-dom';
import FontIcon from 'react-toolbox/lib/font_icon';
import { Navigation } from 'react-toolbox/lib/navigation';
import { Notifs } from 'redux-notifications';
import TopBarProgress from 'react-topbar-progress-indicator';
import { loadConfig as actionLoadConfig } from '../actions/config';
import { loginUser as actionLoginUser, logoutUser as actionLogoutUser } from '../actions/auth';
import { currentBackend } from '../backends/backend';
import { showCollection, createNewEntry } from '../actions/collections';
import { openMediaLibrary as actionOpenMediaLibrary } from '../actions/mediaLibrary';
import Header from './Header';
import MediaLibrary from '../components/MediaLibrary/MediaLibrary';
import { Loader, Toast } from '../components/UI/index';
import { getCollectionUrl, getNewEntryUrl } from '../lib/urlHelper';
import { SIMPLE, EDITORIAL_WORKFLOW } from '../constants/publishModes';
import Collection from '../Collection/Collection';
import EntryPage from '../containers/EntryPage';
import SearchPage from '../containers/SearchPage';
import NotFoundPage from '../containers/NotFoundPage';

TopBarProgress.config({
  barColors: {
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

    return (
      <div className="nc-app-container">
        <Notifs CustomComponent={Toast} />
        <Header
          user={user}
          collections={collections}
          onCreateEntryClick={createNewEntry}
          onLogoutClick={logoutUser}
          openMediaLibrary={openMediaLibrary}
        />
        <div className="nc-app-main">
          { isFetching && <TopBarProgress /> }
          <div>
            <Switch>
              <Redirect exact from="/" to={`/collections/${collections.first().get('name')}`} />
              <Route exact path="/collections/:name" component={Collection} />
              <Route path="/collections/:name/new" render={(props) => (<EntryPage {...props} newRecord />)} />
              <Route path="/collections/:name/entries/:slug" component={EntryPage} />
              <Route path="/search/:searchTerm" component={SearchPage} />
              <Route component={NotFoundPage} />
            </Switch>
            <MediaLibrary/>
          </div>
        </div>
      </div>
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
    openMediaLibrary: () => {
      dispatch(actionOpenMediaLibrary());
    },
    logoutUser: () => {
      dispatch(actionLogoutUser());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
