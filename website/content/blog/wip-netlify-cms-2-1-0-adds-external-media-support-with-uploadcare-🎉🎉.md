---
title: "WIP - Netlify CMS 2.1.0 adds external media support with Uploadcare!! \U0001F389\U0001F389"
author: Shawn Erquhart
description: >-
  Netlify CMS 2.1.0 adds external media support with Uploadcare, allowing files
  like images and videos to be stored outside of your Git repository.
date: 2018-09-05T20:52:30.334Z
---
We've known for a long time that storing large files like images and videos in Git is suboptimal, and developers have long been requesting support for hosting these assets through external services.

**Now you can!!**

In Netlify CMS 2.1.0, you can use a supported external service for all asset hosting, and it only requires a change to your configuration.

## First Integration: Uploadcare

[Uploadcare](https://uploadcare.com) has a special place in our hearts. They're a fantastic service for hosting images and more, with tons of features and great pricing. We ended up connecting with them when, in response to customer requests, they created their own Netlify CMS integration before we even had an API to do so.
