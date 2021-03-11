![Netlify CMS](cms.png)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/netlify/netlify-cms/blob/master/LICENSE) [![Netlify Status](https://api.netlify.com/api/v1/badges/2cfc19a8-1216-4070-bbb4-4a1c38b57132/deploy-status)](https://app.netlify.com/sites/cms-demo/deploys) [![npm version](https://img.shields.io/npm/v/netlify-cms.svg?style=flat)](https://www.npmjs.com/package/netlify-cms) [![Build Status](https://github.com/netlify/netlify-cms/workflows/Node%20CI/badge.svg)](https://github.com/netlify/netlify-cms/actions?query=branch%3Amaster+workflow%3A%22Node+CI%22) ![FOSSA Status](https://app.fossa.com/api/projects/custom%2B17679%2Fgit%40github.com%3Anetlify%2Fnetlify-cms.git.svg?type=shield) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md)

[netlifycms.org](https://www.netlifycms.org/) 

A CMS for static site generators. Give users a simple way to edit
and add content to any site built with a static site generator.

## Community Chat

<a href="https://netlifycms.org/chat">
  <img alt="Join us on Slack" src="https://raw.githubusercontent.com/netlify/netlify-cms/master/website/static/img/slack.png" width="165"/>
</a>

## How It Works

Netlify CMS is a single-page app that you pull into the `/admin` part of your site.

It presents a clean UI for editing content stored in a Git repository.

You setup a YAML config to describe the content model of your site, and typically
tweak the main layout of the CMS a bit to fit your own site.

When a user navigates to `/admin/` they'll be prompted to log in, and once authenticated
they'll be able to create new content or edit existing content.

Read more about Netlify CMS [Core Concepts](https://www.netlifycms.org/docs/intro/).

# Installation and Configuration

The Netlify CMS can be used in two different ways.

* A Quick and easy install, that requires you to create a single HTML file and a configuration file. All the CMS JavaScript and CSS are loaded from a CDN.
  To learn more about this installation method, refer to the [Quick Start Guide](https://www.netlifycms.org/docs/quick-start/)
* A complete, more complex install, that gives you more flexibility but requires that you use a static site builder with a build system that supports npm packages.

# Contributing

New contributors are always welcome! Check out [CONTRIBUTING.md](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md) to get involved.

# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release is documented on the Github [Releases](https://github.com/netlify/netlify-cms/releases) page.

# License

Netlify CMS is released under the [MIT License](LICENSE).
Please make sure you understand its [implications and guarantees](https://writing.kemitchell.com/2016/09/21/MIT-License-Line-by-Line.html).

# Thanks

## Services
These services support Netlify CMS development by providing free infrastructure.
<p>
  <a href="https://www.travis-ci.org">
    <img src="https://raw.githubusercontent.com/netlify/netlify-cms/master/img/travis.png" height="38" alt="travis-ci" />
  </a>
  <img src="https://spacergif.org/spacer.gif" width="20"/>
  <a href="https://www.browserstack.com">
    <img src="https://raw.githubusercontent.com/netlify/netlify-cms/master/img/browserstack.png" height="38" alt="browserstack" />
  </a>
  <img src="https://spacergif.org/spacer.gif" width="20"/>
  <a href="https://www.cypress.io">
    <img src="https://raw.githubusercontent.com/netlify/netlify-cms/master/img/cypressio.png" height="38" alt="Cypress.io" />
  </a>
</p>
