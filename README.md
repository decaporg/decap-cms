![Decap CMS](/img/decap.svg)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/decaporg/decap-cms/blob/main/LICENSE) [![Netlify Status](https://api.netlify.com/api/v1/badges/8b87160b-0a11-4f75-8050-1d21bc1cff8c/deploy-status)](https://app.netlify.com/sites/decap-www/deploys) [![npm version](https://img.shields.io/npm/v/decap-cms.svg?style=flat)](https://www.npmjs.com/package/decap-cms) [![Build Status](https://github.com/decaporg/decap-cms/workflows/Node%20CI/badge.svg)](https://github.com/decaporg/decap-cms/actions?query=branch%3Amain+workflow%3A%22Node+CI%22) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/decaporg/decap-cms/blob/main/CONTRIBUTING.md)

[decapcms.org](https://www.decapcms.org/)

A CMS for static site generators. Give users a simple way to edit and add content to any site built with a static site generator.

_Decap CMS is the new name of Netlify CMS [since February 2023](https://www.netlify.com/blog/netlify-cms-to-become-decap-cms/)._

<a href="https://decapcms.org/chat">Join us on Discord</a> for community chat.

## How It Works

Decap CMS is a single-page app that you pull into the `/admin` part of your site.

It presents a clean UI for editing content stored in a Git repository.

You setup a YAML config to describe the content model of your site, and typically
tweak the main layout of the CMS a bit to fit your own site.

When a user navigates to `/admin/` they'll be prompted to log in, and once authenticated
they'll be able to create new content or edit existing content.

Read more about Decap CMS [Core Concepts](https://www.decapcms.org/docs/intro/).

## Installation and Configuration

The Decap CMS can be used in two different ways.

* A Quick and easy install, that requires you to create a single HTML file and a configuration file. All the CMS JavaScript and CSS are loaded from a CDN.
  To learn more about this installation method, refer to the [Quick Start Guide](https://www.decapcms.org/docs/quick-start/)
* A complete, more complex install, that gives you more flexibility but requires that you use a static site builder with a build system that supports npm packages.

## Sponsor

Help support Decap CMS development by becoming a sponsor! Your contributions help us maintain and improve this open-source project.

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/decaporg)
[![Open Collective](https://img.shields.io/badge/Sponsor-Open%20Collective-blue?style=for-the-badge&logo=opencollective)](https://opencollective.com/decap)

These are our sponsors on both platforms. Thank you for your support!

![Open Collective Backers](https://opencollective.com/decap/backers.svg?limit=30&button=false&avatarHeight=48&width=400)

<!-- sponsors --><a href="https://github.com/Zwyx"><img src="https://github.com/Zwyx.png" width="48px" alt="Zwyx" style="border-radius:50%" /></a> &nbsp;<a href="https://github.com/smolcodes"><img src="https://github.com/smolcodes.png" width="48px" alt="smolcodes" style="border-radius:50%" /></a> &nbsp;<a href="https://github.com/shizik"><img src="https://github.com/shizik.png" width="48px" alt="shizik" style="border-radius:50%" /></a> &nbsp;<a href="https://github.com/JacquesRaoult"><img src="https://github.com/JacquesRaoult.png" width="48px" alt="JacquesRaoult" style="border-radius:50%" /></a> &nbsp;<!-- sponsors -->

## Contribute

New contributors are always welcome! Check out [CONTRIBUTING.md](https://github.com/decaporg/decap-cms/blob/main/CONTRIBUTING.md) to get involved.

## Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release is documented on the GitHub [Releases](https://github.com/decaporg/decap-cms/releases) page.

## License

Decap CMS is released under the [MIT License](LICENSE).
Please make sure you understand its [implications and guarantees](https://writing.kemitchell.com/2016/09/21/MIT-License-Line-by-Line.html).

## Maintainers

Maintained with care by <a href="https://techhub.p-m.si/">PM TechHub</a> & friends.

## Professional help

Our partners offer a range of services that can help you get the most out of Decap CMS. Find onboarding, priority support, and development of custom features.

[Read more on our professional help page](https://decapcms.org/services/)
