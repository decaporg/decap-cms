---
title: Custom Mount Element
weight: 90
group: Customization
---

Decap CMS always creates its own DOM element for mounting the application, which means it always takes over the entire page, and is generally inflexible if you're trying to do something creative, like injecting it into a shared context.

You can now provide your own element for Decap CMS to mount in by setting the target element's ID as `id="nc-root"`. If Decap CMS finds an element with this ID during initialization, it will mount within that element instead of creating its own.

This is useful if you want to create a wrapper around the CMS, like a custom header, footer, or sidebar.

**Example**

Adding the following div to `admin/index.html` will cause the CMS to load within it:

<div id="nc-root"></div>
