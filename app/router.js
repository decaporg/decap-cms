import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route("login");
  this.route("index", {path: "/"}, function() {
    this.route("dashboard", {path: "/"});
    this.route("list", {path: "/collections/:collection_id"});
  });
  this.route("create", {path: "/collections/:collection_id/entries"});
  this.route("edit", {path: "/collections/:collection_id/entries/:slug"});
});

export default Router;
