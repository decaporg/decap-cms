# Docs coming soon!

Netlify CMS was recently converted from a single npm package to a "monorepo" of over 20 packages.
That's over 20 Readme's! We haven't created one for this package yet, but we will soon.

In the meantime, you can:

1. Check out the [main readme](https://github.com/netlify/netlify-cms/#readme) or the [documentation
   site](https://www.netlifycms.org) for more info.
2. Reach out to the [community chat](https://netlifycms.org/chat/) if you need help.
3. Help out and [write the readme yourself](https://github.com/netlify/netlify-cms/edit/master/packages/netlify-cms-core/README.md)!

# Using Core

```tsx
import React from 'react';
import {
  AzureBackend,
  BitbucketBackend,
  BooleanWidget,
  CodeWidget,
  ColorStringWidget,
  DateTimeWidget,
  FileWidget,
  GitGatewayBackend,
  GitHubBackend,
  GitLabBackend,
  imageEditorComponent,
  ImageWidget,
  ListWidget,
  MapWidget,
  MarkdownWidget,
  NetlifyCmsCore as CMS,
  NumberWidget,
  ObjectWidget,
  ProxyBackend,
  RelationWidget,
  SelectWidget,
  StringWidget,
  TestBackend,
  TextWidget,
  locales,
  Icon,
  images
} from 'netlify-cms-core';

// Register all the things
CMS.registerBackend('git-gateway', GitGatewayBackend);
CMS.registerBackend('azure', AzureBackend);
CMS.registerBackend('github', GitHubBackend);
CMS.registerBackend('gitlab', GitLabBackend);
CMS.registerBackend('bitbucket', BitbucketBackend);
CMS.registerBackend('test-repo', TestBackend);
CMS.registerBackend('proxy', ProxyBackend);
CMS.registerWidget([
  StringWidget.Widget(),
  NumberWidget.Widget(),
  TextWidget.Widget(),
  ImageWidget.Widget(),
  FileWidget.Widget(),
  SelectWidget.Widget(),
  MarkdownWidget.Widget(),
  ListWidget.Widget(),
  ObjectWidget.Widget(),
  RelationWidget.Widget(),
  BooleanWidget.Widget(),
  MapWidget.Widget(),
  DateTimeWidget.Widget(),
  CodeWidget.Widget(),
  ColorStringWidget.Widget(),
]);
CMS.registerEditorComponent(imageEditorComponent);
CMS.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block',
});
CMS.registerLocale('en', locales.en);

Object.keys(images).forEach(iconName => {
  CMS.registerIcon(iconName, <Icon type={iconName} />);
});
```