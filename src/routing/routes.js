import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from '../containers/App';
import DashboardPage from '../containers/DashboardPage';
import CollectionPage from '../containers/CollectionPage';
import EntryPage from '../containers/EntryPage';
import SearchPage from '../containers/SearchPage';
import NotFoundPage from '../containers/NotFoundPage';
import { forceSingleTrailingSlash, forceSingleTrailingSlashOnChange } from './forceSingleTrailingSlash';

export default (
  <Route onEnter={forceSingleTrailingSlash} onChange={forceSingleTrailingSlashOnChange}>
    <Route path="/" component={App}>
      <IndexRoute component={DashboardPage} />
      <Route
        path="/collections/:name"
        component={CollectionPage}
      />
      <Route
        path="/collections/:name/entries/new"
        component={EntryPage}
        newRecord
      />
      <Route
        path="/collections/:name/entries/:slug"
        component={EntryPage}
      />
      <Route
        path="/search/:searchTerm"
        component={SearchPage}
      />
      <Route
        path="*"
        component={NotFoundPage}
      />
    </Route>
  </Route>
);
