import React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import App from '../containers/App';
import CollectionPage from '../containers/CollectionPage';
import EntryPage from '../containers/EntryPage';
import NotFoundPage from '../containers/NotFoundPage';

export default () => (
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={CollectionPage}/>
      <Route path="/collections/:name" component={CollectionPage}/>
      <Route path="/collections/:name/entries/:slug" component={EntryPage}/>
      <Route path="*" component={NotFoundPage}/>
    </Route>
  </Router>
);
