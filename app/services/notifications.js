import Ember from 'ember';

export default Ember.Object.extend({
  defaultIcon: "/favicon.ico",

  withPermission: function() {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (!window.Notification) { return reject("Browser doesn't support notifications"); }
      if (window.Notification.permission === "granted") { return resolve(true); }
      if (window.Notification.permission === "denied") { return reject("Permission to send notifications denied"); }
      window.Notification.requestPermission(function(permission) {
        return permission ? resolve(true) : reject("Permission to send notifications denied");
      });
    });
  },

  notify: function(title, body) {
    var settings = this.get("config.notifications") || {};
    var icon = settings.icon || this.defaultIcon;
    this.withPermission().then(function() {
      new window.Notification(title, {
        icon: icon,
        body: body
      });
    }, function(err) { console.log(err); });
  }
});
