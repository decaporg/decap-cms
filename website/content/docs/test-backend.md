---
title: Test
weight: 30
group: backends
---

You can use the `test-repo` backend to try out Netlify CMS without connecting to a Git repo. With this backend, you can write and publish content normally, but any changes will disappear when you reload the page. This backend powers the Netlify CMS [demo site](https://cms-demo.netlify.com/).

**Note:** The `test-repo` backend can't access your local file system, nor does it connect to a Git repo, thus you won't see any existing files while using it.

To enable this backend, add the following lines to your Netlify CMS `config.yml` file:

```yaml
backend:
  name: test-repo
```
