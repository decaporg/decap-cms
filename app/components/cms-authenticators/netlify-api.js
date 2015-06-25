import Ember from 'ember';
import Base from './base';

var defaultURL = "http://localhost:8080";

export default Base.extend({
  email: "",
  password: "",

  authenticate: function() {
    var url = this.get("config.backend.url") || defaultURL;
    return new Ember.RSVP.Promise((resolve, reject) => {
      Ember.$.ajax({
        method: "POST",
        url: url + "/token",
        data: {grant_type: "client_credentials"},
        headers: {
          "Authorization": "Basic " + btoa(this.get("email") + ":" + this.get("password"))
        }
      }).then((data) => {
        console.log("Got data: %o", data);
        resolve({access_token: data.access_token});
      }, (err) => { reject(err); });
    })
  }
});
