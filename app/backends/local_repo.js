import Ember from 'ember';
/* global Base64 */

/**
@module app
@submodule backends
*/

var Promise = Ember.RSVP.Promise;


/**
 LocalRepo repository backend.

 To use this backend, download the relevant release from [Github](https://github.com/netlify/cms-local-backend),
 make sure the binary is in your PATH and then run `netlify-local-cms` from within your website repo.

 Configure the backend in your config.yml like this:

 ```yaml
 backend:
   type: local
 ```

 @class LocalRepo
 */
export default Ember.Object.extend({
  init: function(config) {

  },

  authorize: function(credentials) {

  },

  listFiles: function(path) {

  },

  readFile: function(path, sha) {

  },

  updateFiles: function(files, options) {

  }
});
