---
group: Configuration
weight: 200
title: Beta Features!
---
We run new functionality in an open beta format from time to time. That means that this functionality is totally available for use, and we *think* it might be ready for primetime, but it could break or change without notice.

**Use these features at your own risk.**



## Summary string template transformations

You can apply transformations on fields in a summary string template using filter notation syntax.

Example config:

```yaml
collections:
  - name: 'posts'
    label: 'Posts'
    folder: '_posts'
    summary: "{{title | upper}} - {{date | date('YYYY-MM-DD')}} – {{body | truncate(20, '***')}}"
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

The above config will transform the title field to uppercase and format the date field using `YYYY-MM-DD` format.
Available transformations are `upper`, `lower`, `date('<format>')`, `default('defaultValue')`, `ternary('valueForTrue','valueForFalse')` and `truncate(<number>)`/`truncate(<number>, '<string>')`  




## Remark plugins

You can register plugins to customize [`remark`](https://github.com/remarkjs/remark), the library used by the richtext editor for serializing and deserializing markdown.

```js
// register a plugin
CMS.registerRemarkPlugin(plugin);

// provide global settings to all plugins, e.g. for customizing `remark-stringify`
CMS.registerRemarkPlugin({ settings: { bullet: '-' } });
```

Note that `netlify-widget-markdown` currently uses `remark@10`, so you should check a plugin's compatibility first.
