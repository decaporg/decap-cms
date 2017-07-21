# Welcome, contributors!

We're hoping that Netlify CMS will do for the [JAMstack](https://www.jamstack.org) what WordPress did for dynamic sites back in the day. We know we can't do that without building a thriving community of contributors and users, and we'd love to have you join us.

While we work on building this page (and you can help!), here are some links with more information about getting involved:

* [Project Roadmap](https://github.com/netlify/netlify-cms/projects/3)
* [Code of Conduct](https://github.com/netlify/netlify-cms/blob/master/CODE_OF_CONDUCT.md)
* [Setup instructions and Contribution Guidelines](https://github.com/netlify/netlify-cms/blob/master/CONTRIBUTING.md)


## I18N

I18N strings are managed by [polyglot](http://airbnb.io/polyglot.js/).
Strings are extracted from source code with static analysis by [i18n-extract](https://github.com/oliviertassinari/i18n-extract).
Code is searched for regex /polyglot.t('[^']')/ so if you want particular string to be translated,
you have to follow this rule.
For more info see [polyglot](http://airbnb.io/polyglot.js/) or [example](../src/components/FindBar/FindBar.js)

Extractions shall be extracted manually extra for each language.
By one extraction run, one file (JSON) is produced (or updated if it already exists).
to extract/update i18n strings run:

```
npm run extract --lang <code of your language>
```

E.g. czech language strings (international code cs) run:

```
npm run extract --lang cs
```
