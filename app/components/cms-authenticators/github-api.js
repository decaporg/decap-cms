import Ember from 'ember';
import Base from './base';
/* global netlify */

export default Base.extend({
  authenticationErrorMessage: "Failed to authenticate with GitHub",
  authorizationErrorMessage: "This GitHub user doesn't have permissions to edit this site.",
  tagName: "",
  authenticate: function() {
    return new Ember.RSVP.Promise((resolve, reject) => {
      if (document.location.host.split(":")[0] === "localhost") {
        netlify.configure({site_id: 'cms.netlify.com'});
      }
      netlify.authenticate({provider: "github", scope: "repo"}, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve({github_access_token: data.token});
      });
    });
  }
});
