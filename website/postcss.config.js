const neatgrid = require('postcss-neat');
const nestedcss = require('postcss-nested');
// const colorfunctions = require('postcss-colour-functions');
const hdBackgrounds = require('postcss-at2x');
const cssextend = require('postcss-simple-extend');
const cssvars = require('postcss-simple-vars-async');

const styleVariables = require('./src/theme');

module.exports = () => ({
  plugins: [
    neatgrid(),
    nestedcss(),
    // colorfunctions(),
    hdBackgrounds(),
    cssextend(),
    cssvars({ variables: styleVariables }),
  ],
});
