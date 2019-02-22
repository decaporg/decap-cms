---
title: Netlify CMS 2.4.0
author: Shawn Erquhart
description: >-
  Netlify CMS 2.4.0 is out with Deploy Preview Links, a new Map widget, and
  more!
twitter_image: /img/preview-link-published.png
date: 2019-02-08T23:00:58.501Z
---
Netlify CMS 2.4.0 is out with significant bugfixes, like working validation for nested fields, and some nice new features, including [Deploy Preview Links](https://www.netlifycms.org/blog/2019/02/deploy-preview-links) and a new [Map widget](https://www.netlifycms.org/docs/widgets/#map)!

## Release Notes


### Features
* `loadEntry` method now available to widgets ([@leonardodino](https://github.com/leonardodino) in [#2010](https://github.com/netlify/netlify-cms/pull/2010))
* Loading `config.yml` can now be skipped ([@talves](https://github.com/talves) in [#2053](https://github.com/netlify/netlify-cms/pull/2053))
* Map widget ([@friedjoff](https://github.com/friedjoff) in [#2051](https://github.com/netlify/netlify-cms/pull/2051)
* Deploy preview links ([@erquhart](https://github.com/erquhart) in [#2028](https://github.com/netlify/netlify-cms/pull/2028))
* Number widget now offers range validation ([@lmcorreia](https://github.com/lmcorreia) in [#2049](https://github.com/netlify/netlify-cms/pull/2049))

### Bugfixes
* Markdown widget parsing improvements - leading/trailing whitespace ([@papandreou](https://github.com/papandreou) in [#1517](https://github.com/netlify/netlify-cms/pull/1517))
* Relation widgets in a list no longer swap values after drag and drop ([@barthc](https://github.com/barthc) in [#2018](https://github.com/netlify/netlify-cms/pull/2018))
* Defining custom frontmatter delimiters with an array works ([@daneden](https://github.com/daneden) in [#1997](https://github.com/netlify/netlify-cms/pull/1997))
* Use label instead of value in select widget when using multiple select ([@selaux](https://github.com/selaux) in [#2054](https://github.com/netlify/netlify-cms/pull/2054)
* Field validation now works for nested fields (inside of object or list widget) ([@barthc](https://github.com/barthc) in [#1873](https://github.com/netlify/netlify-cms/pull/1873))
* Fix preview reliability issue for relation widget ([@barthc](https://github.com/barthc) in [#2011](https://github.com/netlify/netlify-cms/pull/2011))
