import PropTypes from 'prop-types';
connect;
import React, { useState, useEffect } from 'react';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { Route, Switch, Redirect, useLocation } from 'react-router-dom';
import TopBarProgress from 'react-topbar-progress-indicator';
import { Loader, lightTheme } from 'decap-cms-ui-next';

import { loadConfig } from '../../actions/config';
import { loginUser, logoutUser } from '../../actions/auth';
import { currentBackend } from '../../backend';
import { createNewEntry } from '../../actions/collections';
import MediaPage from '../MediaLibrary/MediaPage';
import MediaDialog from '../MediaLibrary/MediaDialog';
import { Notifications } from '../UI';
import { history } from '../../routing/history';
import { SIMPLE, EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import Collection from '../Collection/Collection';
import Workflow from '../Workflow/Workflow';
import Editor from '../Editor/Editor';
import NotFoundPage from './NotFoundPage';
import Nav from './Nav';
import Header from './Header';
import Dashboard from '../Dashboard/Dashboard';

TopBarProgress.config({
  barColors: {
    0: lightTheme.color.primary['900'],
    '1.0': lightTheme.color.primary['900'],
  },
  shadowBlur: 0,
  barThickness: 2,
});

const AppMainContainer = styled.div`
  height: calc(100% - 80px); /* 80px is the height of the header */
`;

const AppOuter = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const AppBody = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    flex-direction: column-reverse;
  }
`;

const AppContent = styled.div`
  flex: 1;
  height: 100%;
  max-height: 100%;
  position: relative;
`;

const ErrorContainer = styled.div`
  margin: 20px;
`;

const ErrorCodeBlock = styled.pre`
  margin-left: 20px;
  font-size: 15px;
  line-height: 1.5;
`;

// TODO: Move from collection to dashboard
function getDefaultPath(collections) {
  // return `/collections/${collections.first().get('name')}`;

  return '/dashboard';
}

function RouteInCollection({ collections, render, ...props }) {
  const defaultPath = getDefaultPath(collections);
  return (
    <Route
      {...props}
      render={routeProps => {
        const collectionExists = collections.get(routeProps.match.params.name);
        return collectionExists ? render(routeProps) : <Redirect to={defaultPath} />;
      }}
    />
  );
}

function App({
  auth,
  config,
  collections,
  resources,
  loginUser,
  logoutUser,
  loadConfig,
  user,
  isFetching,
  publishMode,
  useMediaLibrary,
  showMediaButton,
  t,
}) {
  function configError(config) {
    return (
      <ErrorContainer>
        <h1>{t('app.app.errorHeader')}</h1>
        <div>
          <strong>{t('app.app.configErrors')}:</strong>
          <ErrorCodeBlock>{config.error}</ErrorCodeBlock>
          <span>{t('app.app.checkConfigYml')}</span>
        </div>
      </ErrorContainer>
    );
  }

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const { pathname } = useLocation();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (
      pathname.match('/collections/[a-zA-Z0-9_-]+/new') ||
      pathname.match('/collections/[a-zA-Z0-9_-]+/entries/[a-zA-Z0-9_-]+')
    ) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [pathname]);

  function handleLogin(credentials) {
    loginUser(credentials);
  }

  function authenticating() {
    const backend = currentBackend(config);

    if (backend == null) {
      return (
        <div>
          <h1>{t('app.app.waitingBackend')}</h1>
        </div>
      );
    }

    return (
      <div>
        <Notifications />
        {React.createElement(backend.authComponent(), {
          onLogin: handleLogin.bind(this),
          error: auth.error,
          inProgress: auth.isFetching,
          siteId: config.backend.site_domain,
          base_url: config.backend.base_url,
          authEndpoint: config.backend.auth_endpoint,
          config,
          clearHash: () => history.replace('/'),
          t,
        })}
      </div>
    );
  }

  function handleLinkClick(event, handler, ...args) {
    event.preventDefault();
    handler(...args);
  }

  if (config === null) {
    return null;
  }

  if (config.error) {
    return configError(config);
  }

  if (config.isFetching) {
    return <Loader>{t('app.app.loadingConfig')}</Loader>;
  }

  if (user == null) {
    return authenticating(t);
  }

  const defaultPath = getDefaultPath(collections);
  const hasWorkflow = publishMode === EDITORIAL_WORKFLOW;

  return (
    <>
      <AppOuter>
        <AppBody>
          <Nav
            collections={collections}
            resources={resources}
            location={location}
            showMediaButton={showMediaButton}
            hasWorkflow={hasWorkflow}
            siteUrl={config.site_url}
            displayUrl={config.display_url || config.site_url}
            logoUrl={config.logo_url}
          />

          <AppContent>
            {!isEditing && (
              <Header
                user={user}
                collections={collections}
                onCreateEntryClick={createNewEntry}
                onLogoutClick={logoutUser}
              />
            )}

            <AppMainContainer>
              {isFetching && <TopBarProgress />}
              <Switch>
                <Redirect exact from="/" to={defaultPath} />
                <Redirect exact from="/search/" to={defaultPath} />
                <Redirect
                  // This happens on Identity + Invite Only + External Provider email not matching
                  // the registered user
                  from="/error=access_denied&error_description=Signups+not+allowed+for+this+instance"
                  to={defaultPath}
                />
                <Route path="/dashboard" component={Dashboard} />
                {hasWorkflow ? <Route path="/workflow" component={Workflow} /> : null}
                <Route path="/media" render={props => <MediaPage {...props} />} />

                <RouteInCollection
                  exact
                  collections={collections}
                  path="/collections/:name"
                  render={props => <Collection t={t} {...props} />}
                />
                <RouteInCollection
                  path="/collections/:name/new"
                  collections={collections}
                  render={props => <Editor {...props} newRecord />}
                />
                <RouteInCollection
                  path="/collections/:name/entries/*"
                  collections={collections}
                  render={props => <Editor {...props} />}
                />
                <RouteInCollection
                  path="/collections/:name/search/:searchTerm"
                  collections={collections}
                  render={props => <Collection {...props} isSearchResults isSingleSearchResult />}
                />
                <RouteInCollection
                  collections={collections}
                  path="/collections/:name/filter/:filterTerm*"
                  render={props => <Collection {...props} />}
                />
                <Route
                  path="/search/:searchTerm"
                  render={props => <Collection t={t} {...props} isSearchResults />}
                />
                <RouteInCollection
                  path="/edit/:name/:entryName"
                  collections={collections}
                  render={({ match }) => {
                    const { name, entryName } = match.params;
                    return <Redirect to={`/collections/${name}/entries/${entryName}`} />;
                  }}
                />
                <Route component={NotFoundPage} />
              </Switch>
              {useMediaLibrary ? <MediaDialog /> : null}
            </AppMainContainer>
          </AppContent>
        </AppBody>
        {/* <ToastContainer /> */}
        <Notifications />
      </AppOuter>
    </>
  );
}

App.propTypes = {
  auth: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  collections: ImmutablePropTypes.map.isRequired,
  loginUser: PropTypes.func.isRequired,
  logoutUser: PropTypes.func.isRequired,
  user: PropTypes.object,
  isFetching: PropTypes.bool.isRequired,
  publishMode: PropTypes.oneOf([SIMPLE, EDITORIAL_WORKFLOW]),
  siteId: PropTypes.string,
  useMediaLibrary: PropTypes.bool,
  showMediaButton: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { auth, config, collections, resources, globalUI, mediaLibrary } = state;
  const user = auth.user;
  const isFetching = globalUI.isFetching;
  const publishMode = config.publish_mode;
  const useMediaLibrary = !mediaLibrary.get('externalLibrary');
  const showMediaButton = mediaLibrary.get('showMediaButton');
  return {
    auth,
    config,
    collections,
    resources,
    user,
    isFetching,
    publishMode,
    showMediaButton,
    useMediaLibrary,
  };
}

const mapDispatchToProps = {
  loadConfig,
  loginUser,
  logoutUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(App));
