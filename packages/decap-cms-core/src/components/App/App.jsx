import PropTypes from 'prop-types';
connect;
import React, { useEffect } from 'react';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import TopBarProgress from 'react-topbar-progress-indicator';
import { Loader, lightTheme } from 'decap-cms-ui-next';

import { loadConfig } from '../../actions/config';
import { loginUser, logoutUser } from '../../actions/auth';
import { currentBackend } from '../../backend';
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
import Dashboard from '../Dashboard/Dashboard';

TopBarProgress.config({
  barColors: {
    0: lightTheme.color.primary['900'],
    '1.0': lightTheme.color.primary['900'],
  },
  shadowBlur: 0,
  barThickness: 2,
});

const AppOuter = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const AppBody = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;

  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    flex-direction: column-reverse;
  }
`;

const AppMainContainer = styled.main`
  flex: 1;
  margin: 1rem 1rem 1rem 0;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    margin: 0;
  }
  background-color: ${({ theme }) => theme.color.surface};
  border-radius: 6px;
  overflow: scroll;
`;

const ErrorContainer = styled.div`
  margin: 20px;
`;

const ErrorCodeBlock = styled.pre`
  margin-left: 20px;
  font-size: 15px;
  line-height: 1.5;
`;

const DEFAULT_PATH = '/dashboard';

function RouteInCollection({ collections, render, ...props }) {
  return (
    <Route
      {...props}
      render={routeProps => {
        const collectionExists = collections.get(routeProps.match.params.name);
        return collectionExists ? render(routeProps) : <Redirect to={DEFAULT_PATH} />;
      }}
    />
  );
}

function App({
  auth,
  config,
  branding,
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

  const hasWorkflow = publishMode === EDITORIAL_WORKFLOW;

  return (
    <AppOuter>
      <AppBody>
        <Nav
          collections={collections}
          resources={resources}
          location={location}
          showMediaButton={showMediaButton}
          hasWorkflow={hasWorkflow}
          defaultPath={DEFAULT_PATH}
          appName={branding.app_name}
          logoUrl={branding.logo_url}
          user={user}
          onLogoutClick={logoutUser}
        />

        <AppMainContainer>
          {isFetching && <TopBarProgress />}
          <Switch>
            <Redirect exact from="/" to={DEFAULT_PATH} />
            <Redirect exact from="/search/" to={DEFAULT_PATH} />
            <Redirect
              // This happens on Identity + Invite Only + External Provider email not matching
              // the registered user
              from="/error=access_denied&error_description=Signups+not+allowed+for+this+instance"
              to={DEFAULT_PATH}
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
      </AppBody>
      {/* <ToastContainer /> */}
      <Notifications />
    </AppOuter>
  );
}

App.propTypes = {
  auth: PropTypes.object.isRequired,
  branding: PropTypes.object.isRequired,
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
  const { auth, branding, config, collections, resources, globalUI, mediaLibrary } = state;
  const user = auth.user;
  const isFetching = globalUI.isFetching;
  const publishMode = config.publish_mode;
  const useMediaLibrary = !mediaLibrary.get('externalLibrary');
  const showMediaButton = mediaLibrary.get('showMediaButton');
  return {
    auth,
    branding,
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
