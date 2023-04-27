---
title: March 2023 Status Update
description: >-
  Updating Slate, fixing Cypress tests, and preparing for the first PR
date: 2023-03-31T08:00:00.000Z
author: Anže Demšar
twitter_image: /img/preview-link-published.png
---
We took over this project a month ago and although there were not many commits to the main repository, we have been working on the project under the hood. We want the first Decap release to be a drop-in replacement, and we want to make sure that it works.

We figured that the only way to upgrade libraries and not make breaking changes is to make the tests pass without changing any conditions. Very soon it also became clear that in order to do that, Slate will have to be upgraded and this is the rabbit hole that I am now slowly crawling out of.

Slate was rewritten from scratch a few years ago and there were more and more problems with the deprecated version that Decap is using. These bugs also destroyed any possibilities of Cypress tests going through.

The good news is that the serialization process was Slate -> Remark -> Markdown, so we only had to change the Slate -> Remark part and renderers. The bad news is that toolbar button functionalities (including lists) are no longer part of the base editor and we had to do this part on our own (we have considered some of the existing list plugins, but none of them seemed to be close to the one that Decap is currently using).

I am now at a working version that passes all but two markdown tests. I suspect Cypress for one, the other one is a shortcode. After that, the code needs a huge refactor, and then (after our internal review) I will open a pull request.

When the PR is ready, I’d love for invested contributors to review the code so that the update is reliable. This merge will open the possibilities for any kind of other contributions that we all want to see.

We will then comb through the open PRs and merge what is beneficial. After that, my personal favorites would be moving the codebase to Typescript, changing components from class to functional, and supporting the ongoing UI efforts as much as possible.
