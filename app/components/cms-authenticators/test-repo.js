import Ember from 'ember';
import Base from './base';

export default Base.extend({
  authenticate: function() {
    return Ember.RSVP.Promise.resolve({noop: true});
  }
});
