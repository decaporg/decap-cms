---
group: Add
weight: 3
title: 2. Choosing a Backend
---

Now that you have your Decap CMS files in place and configured, all that's left is to enable authentication. We're using the [Netlify](https://www.netlify.com/) platform here because it's one of the quickest ways to get started, but you can learn about other authentication options in the [Backends](/docs/backends-overview) doc.

### Setup on Netlify

Netlify offers a built-in authentication service called Identity. In order to use it, connect your site repo with Netlify. Netlify has published a general [Step-by-Step Guide](https://www.netlify.com/blog/2016/10/27/a-step-by-step-guide-deploying-a-static-site-or-single-page-app/) for this, along with detailed guides for many popular static site generators, including [Jekyll](https://www.netlify.com/blog/2015/10/28/a-step-by-step-guide-jekyll-3.0-on-netlify/), [Hugo](https://www.netlify.com/blog/2016/09/21/a-step-by-step-guide-victor-hugo-on-netlify/), [Hexo](https://www.netlify.com/blog/2015/10/26/a-step-by-step-guide-hexo-on-netlify/), [Middleman](https://www.netlify.com/blog/2015/10/01/a-step-by-step-guide-middleman-on-netlify/), [Gatsby](https://www.netlify.com/blog/2016/02/24/a-step-by-step-guide-gatsby-on-netlify/), and more.

### Enable Identity and Git Gateway

Netlify's Identity and Git Gateway services allow you to manage CMS admin users for your site without requiring them to have an account with your Git host or commit access on your repo. From your site dashboard on Netlify:

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Under **Registration preferences**, select **Open** or **Invite only**. In most cases, you want only invited users to access your CMS, but if you're just experimenting, you can leave it open for convenience.
3. If you'd like to allow one-click login with services like Google and GitHub, check the boxes next to the services you'd like to use, under **External providers**.
4. Scroll down to **Services > Git Gateway**, and click **Enable Git Gateway**. This authenticates with your Git host and generates an API access token. In this case, we're leaving the **Roles** field blank, which means any logged in user may access the CMS. For information on changing this, check the [Netlify Identity documentation](https://www.netlify.com/docs/identity/).

### Add the Netlify Identity Widget

With the backend configured to handle authentication, now you need a frontend interface to connect to it. The open source Netlify Identity Widget is a drop-in widget made for just this purpose. To include the widget in your site, add the following script tag in two places:

```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

Add this to the `<head>` of your CMS index page at `/admin/index.html`, as well as the `<head>` of your site's main index page. Depending on how your site generator is set up, this may mean you need to add it to the default template, or to a "partial" or "include" template. If you can find where the site stylesheet is linked, that's probably the right place. Alternatively, you can include the script in your site using Netlify's [Script Injection](https://www.netlify.com/docs/inject-analytics-snippets/) feature.

When a user logs in with the Netlify Identity widget, an access token directs to the site homepage. In order to complete the login and get back to the CMS, redirect the user back to the `/admin/` path. To do this, add the following script before the closing `body` tag of your site's main index page:

```html
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>
```

**Note:** This example script requires modern JavaScript and does not work on IE11. For legacy browser support, use function expressions (`function () {}`) in place of the arrow functions (`() => {}`), or use a transpiler such as [Babel](https://babeljs.io/).

---

Once this is completed, proceed to: [3. Configure Decap CMS](/docs/configure-decap-cms/)
