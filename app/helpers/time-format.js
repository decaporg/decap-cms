import Ember from 'ember';
/* global moment */

export function timeFormat(params/*, hash*/) {
  if (params.length !== 2) {
    return "Usage: {{time-format date \"format\"}}";
  }

  return moment(params[0]).format(params[1]);
}

export default Ember.Helper.helper(timeFormat);
