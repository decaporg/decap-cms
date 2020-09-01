---
title: Overview
group: guides
weight: 22
---
To see an example configuration, check out the [CMS demo site](https://cms-demo.netlify.com). No password is required; simply click the login button and the CMS will open.

To see working configuration examples, you can [start from a template](../start-with-a-template) or check out the [](https://cms-demo.netlify.com) You can refer to the demo [configuration code](https://github.com/netlify/netlify-cms/blob/master/dev-test/config.yml) to see how each option was configured.

[YAML syntax](https://en.wikipedia.org/wiki/YAML#Basic_components)





## Configuration File

All Netlify CMS configuration options are specified in a YAML file, located wherever you access the editor UI. 

By default, Netlify CMS looks for the configuration file at `/admin/config.yml` , but you can specify a custom path to the configuration file using an HTML link tag:

```html
<!-- Note the "type" and "rel" attribute values, which are required. -->
<link href="path/to/config.yml" type="text/yaml" rel="cms-config-url">
```

## YAML Ain't Markup Language

YAML is a human-friendly language which uses indented block formatting and bracketed inline formatting to arrange nested data. You will commonly find a mix of both block and inline formatting styles in Netlify CMS configuration files, and we recommend reviewing these resources if you have not worked with YAML before:

• [YAML Basic Formatting](https://en.wikipedia.org/wiki/YAML#Basic_components)

• [](https://en.wikipedia.org/wiki/YAML#Syntax)[YAML Syntax](https://en.wikipedia.org/wiki/YAML#Syntax)

• [YAML vs JSON](https://en.wikipedia.org/wiki/YAML#Comparison_with_JSON)