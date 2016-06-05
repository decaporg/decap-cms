# Netlify CMS

A CMS for static site generators. Give non-technical users a simple way to edit
and add content to any site built with a static site generator.

Try the UI demo here: [cms.netlify.com](https://cms.netlify.com).

## How it works

Netlify CMS is a single-page app that you pull into the `/admin` part of your site.

It presents a clean UI for editing content stored in a Git repository.

You setup a YAML config to describe the content model of your site, and typically
tweak the main layout of the CMS a bit to fit your own site.

When a user navigates to `/admin` she'll be prompted to login, and once authenticated
she'll be able to create new content or edit existing content.
