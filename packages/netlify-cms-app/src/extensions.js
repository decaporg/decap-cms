import React from 'react';
// Core
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
  locales
} from 'netlify-cms-core';
import { Icon, images } from 'netlify-cms-ui-default';

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
Object.keys(locales).forEach(locale => {
  CMS.registerLocale(locale, locales[locale]);
});

Object.keys(images).forEach(iconName => {
  CMS.registerIcon(iconName, <Icon type={iconName} />);
});
