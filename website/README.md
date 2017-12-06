# Netlify CMS Website & Docs

This directory builds netlifycms.org. If you'd like to propose changes to the site or docs, you'll find the source files in here.

## Local development

The site is built with [Hugo](https://gohugo.io/), managed as an npm dependency via [hugo-bin](https://www.npmjs.com/package/hugo-bin). 

To run the site locally, you'll need to have [Node](https://nodejs.org) and [Yarn](https://yarnpkg.com/en/) installed on your computer.

From your terminal window, `cd` into the `website` directory of the repo, and run

```bash
yarn
yarn start
```

Then visit http://localhost:3000/ - BrowserSync will automatically reload CSS or
refresh the page when stylesheets or content changes.