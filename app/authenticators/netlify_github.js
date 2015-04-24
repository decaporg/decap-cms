import Ember from 'ember';
/* global netlify */

var Promise = Ember.RSVP.Promise;

export default Ember.Object.extend({
  authenticate: function(config) {
    return new Promise((resolve, reject) => {
      if (document.location.host.split(":")[0] === "localhost") {
        netlify.configure({site_id: 'timespace.netlify.com'});
      }
      netlify.authenticate({provider: "github", scope: "repo"}, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({github_access_token: data.token});
        }
      });
    });
  }
});
