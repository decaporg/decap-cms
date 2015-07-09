/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');
var concatenate = require('broccoli-concat');
var merge       = require('broccoli-merge-trees');

var app = new EmberApp({fingerprint: {enabled: false}});

// Use `app.import` to add additional libraries to the generated
// output files.
//
// If you need to use different assets in different
// environments, specify an object as the first parameter. That
// object's keys should be the environment name and the values
// should be the asset to use in that environment.
//
// If the library that you are including contains AMD or ES6
// modules that you would like to import into your application
// please specify an object with the list of modules as keys
// along with the exports of each module as its value.
app.import("vendor/authentication.js");
app.import("vendor/html-parser.js");
app.import("vendor/meta_hack.js");
app.import('bower_components/ember/ember-template-compiler.js');
app.import('bower_components/js-yaml/dist/js-yaml.js');
app.import('bower_components/moment/moment.js');
app.import('bower_components/js-base64/base64.js');
app.import('bower_components/jquery-sortable/source/js/jquery-sortable.js');
app.import('bower_components/jt.timepicker/jquery.timepicker.js');
app.import('bower_components/jquery.scrollTo/jquery.scrollTo.js');

var appTree = app.toTree();

var jsRelease = concatenate(appTree, {
    inputFiles : ['assets/vendor.js','assets/cms.js'],
    outputFile : '/cms.js',
    header     : '/** Copyright MakerLoop Inc. 2015 **/'
});

var cssRelease = concatenate(appTree, {
    inputFiles : ['assets/vendor.css','assets/cms.css'],
    outputFile : '/cms.css',
    header     : '/** Copyright MakerLoop Inc. 2015 **/'
});

module.exports = merge([appTree, jsRelease, cssRelease]);
