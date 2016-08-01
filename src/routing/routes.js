import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from '../containers/App';
import CollectionPage from '../containers/CollectionPage';
import EntryPage from '../containers/EntryPage';
import SearchPage from '../containers/SearchPage';
import NotFoundPage from '../containers/NotFoundPage';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={CollectionPage}/>
    <Route path="/collections/:name" component={CollectionPage}/>
    <Route path="/collections/:name/entries/:slug" component={EntryPage}/>
    <Route path="/search" component={SearchPage}/>
    <Route path="*" component={NotFoundPage}/>
  </Route>
);
