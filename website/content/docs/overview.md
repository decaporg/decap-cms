---
title: Overview
group: guides
weight: 22
---
All Netlify CMS configuration options are specified in a YAML file, located wherever you access the editor UI. By default, Netlify CMS looks for the configuration file at `/admin/config.yml`, but you can specify a custom path by using an HTML link tag:

```html
<!-- Note the "type" and "rel" attribute values, which are required. -->
<link href="path/to/config.yml" type="text/yaml" rel="cms-config-url">
```

## Try It Out!

You can check out the Netlify CMS demo site [](https://cms-demo.netlify.com)below for a live example, and you can refer to its `config.yml` file to see how everything was set up.

[Netlify CMS Demo Site](https://cms-demo.netlify.com/)\
Clicking "Login" will open a live demo site, no password required.

[Netlify CMS Demo config.yml](https://github.com/netlify/netlify-cms/blob/master/dev-test/config.yml)\
This is a YAML configuration file written with both block & inline formatting.

[Start with a Template](https://www.netlifycms.org/docs/start-with-a-template/)\
You can start with a template if you would like to check out other Netlify CMS configurations.

## Why YAML?

YAML is a simple and friendly language for creating nested data structures that are easy for humans to read. It can be written with indented "block formatting" similar to Python, or a more streamlined "inline formatting" with bracketing similar to JSON. You will commonly find a mix of  block and inline formatting styles in Netlify CMS configuration files, and we recommend reviewing these resources to understand the differences:

• [YAML Basic Formatting](https://en.wikipedia.org/wiki/YAML#Basic_components)

• [](https://en.wikipedia.org/wiki/YAML#Syntax)[YAML Syntax](https://en.wikipedia.org/wiki/YAML#Syntax)

• [YAML vs JSON](https://en.wikipedia.org/wiki/YAML#Comparison_with_JSON)