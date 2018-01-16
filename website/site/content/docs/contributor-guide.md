---
title: Contributing
position: 100
---

# Welcome, contributors!

We're hoping that Netlify CMS will do for the [JAMstack](https://www.jamstack.org) what WordPress did for dynamic sites back in the day. We know we can't do that without building a thriving community of contributors and users, and we'd love to have you join us.

While we work on building this page (and you can help!), here are some links with more information about getting involved:

* [Project Milestones](https://github.com/netlify/netlify-cms/milestones)
* [Code of Conduct](https://github.com/netlify/netlify-cms/blob/master/CODE_OF_CONDUCT.md)
* [Setup instructions and Contribution Guidelines](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md)

## I18N

I18N strings are curently managed by [polyglot](http://airbnb.io/polyglot.js/).
Strings are extracted from source code with static analysis by [i18n-extract](https://github.com/oliviertassinari/i18n-extract).
Code is searched for regex /i18n.t('[^']')/ so if you want particular string to be translated,
you have to inport i18n and use the translated string as param to i18n.t call.
For more info see [for example](../../../src/components/App/Header.js)

Run of extraction extract the i18n-ed strings and updates all existing i18n translations in src/i18n.

```
npm run extract
```

To make extraction add you language, use --lang param:

```
npm run extract --lang <code of your language>
```

E.g. czech language strings (international code cs) run:

```
npm run extract --lang cs
```

### Language settings

Add to config.yaml:

```
lang: <code of your language>
```
