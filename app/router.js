import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route("login");
  this.route("logout");
  this.route("home", {path: "/"});
  this.route("create", {path: "/collections/:collection_id"});
  this.route("edit", {path: "/collections/:collection_id/:slug"});
});

export default Router;
