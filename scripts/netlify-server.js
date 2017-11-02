#!/usr/bin/env node
'use strict';

/**
 * Run a local server to edit content in the CMS.
 * Make sure to run `npm run build` or `yarn build` to build the dist for starting point.
 */
const program = require('commander');
const express = require('express');
const path = require('path');

const projectRoot = path.join(__dirname, "../");

program
  .version('0.1.0')
  .description('Run the express server')
  .usage('<cmd>')
  .option('-p, --cms-path <cmsPath>', 'CMS server absolute path', '/')
  .option('-l, --site-location <siteLocation>', 'site root location', 'test')
  .option('-c, --cms-location <cmsLocation>', 'CMS app location', 'test')
  .option('-d, --dist-location <distLocation>', 'CMS build location', 'dist')
  .action((cmd, command) => {

    console.log(`
    Using ${ command.cmsPath } for absolute url path.
    Using ${ command.siteLocation } for site location.
    Using ${ command.cmsLocation } for cms location.
    Using ${ command.distLocation } for build location.
    `);

    const app = express();

    app.use('/', express.static(path.join(projectRoot, command.siteLocation)));
    app.use(command.cmsPath, express.static(path.join(projectRoot, command.distLocation)));
    app.use(command.cmsPath, express.static(path.join(projectRoot, command.cmsLocation)));


    app.listen(8888, function () {
      console.log('Test CMS app listening on port 8888!');
    });
  });

program.on('--help', () => {
  console.log(`
    Examples:

        $ node netlify-server start
        $ node netlify-server start -d dist
        $ node netlify-server start --dist-location dist --site-location example/site
  `);
});

program.parse(process.argv);
