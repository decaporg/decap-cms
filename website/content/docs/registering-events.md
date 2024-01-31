---
title: Registering to CMS Events
weight: 80
group: Customization
---

You can execute a function when a specific CMS event occurs.

Example usage:

```javascript
CMS.registerEventListener({
  name: 'prePublish',
  handler: ({ author, entry }) => console.log(JSON.stringify({ author, data: entry.get('data') })),
});
```

Supported events are `prePublish`, `postPublish`, `preUnpublish`, `postUnpublish`, `preSave` and `postSave`. The `preSave` hook can be used to modify the entry data like so:

```javascript
CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    return entry.get('data').set('title', 'new title');
  },
});
```
