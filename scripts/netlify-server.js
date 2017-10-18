#!/usr/bin/env node
'use strict';

/* run a local server to edit content in the cms
  Make sure to run `npm run build` to build the dist for starting point
*/
const program = require('commander');

// const fsExpressAPI = require('./src/lib/fs-api/middleware');
const express = require('express');
const path = require('path');
const projectRoot = path.join(__dirname, "../");

program
  .version('0.1.0')
  .description('Run the express server')
  .usage('<cmd>')
  .option('-p, --cms-path <cmsPath>', 'CMS Absolute Path', '/')
  .option('-l, --site-location <siteLocation>', 'Site File Location', 'test')
  .option('-c, --cms-location <cmsLocation>', 'CMS File Location', 'test')
  .option('-d, --dist-location <distLocation>', 'CMS Build Location', 'dist')
  .action((cmd, command) => {
    // console.log('cmd', cmd);
    console.log(`Using ${ command.cmsPath } for absolute url path.`);
    console.log(`Using ${ command.siteLocation } for site location.`);
    console.log(`Using ${ command.cmsLocation } for cms location.`);
    console.log(`Using ${ command.distLocation } for build location.`);

    const app = express();

    app.use('/', express.static(path.join(projectRoot, command.siteLocation)));
    app.use(command.cmsPath, express.static(path.join(projectRoot, command.distLocation)));
    app.use(command.cmsPath, express.static(path.join(projectRoot, command.cmsLocation)));

    // fsExpressAPI(app);

    app.listen(8888, function () {
      console.log('Test CMS app listening on port 8888!');
    });
  });

program.on('--help', () => {
  console.log();
  console.log('  Examples:');
  console.log();
  console.log('    $ node netlify-server-cli start');
  console.log('    $ node netlify-server-cli start -d public');
  console.log('    $ node netlify-server-cli start --dist-location public --site-location example/site');
  console.log();
});

program.parse(process.argv);
