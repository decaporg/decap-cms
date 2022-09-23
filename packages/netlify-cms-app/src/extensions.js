import React from 'react';
// Core
import {
  BooleanWidget,
  CodeWidget,
  ColorStringWidget,
  DatetimeWidget,
  DateWidget,
  FileWidget,
  ImageWidget,
  ListWidget,
  MapWidget,
  MarkdownWidget,
  NetlifyCmsCore as CMS,
  NumberWidget,
  ObjectWidget,
  RelationWidget,
  SelectWidget,
  StringWidget,
  TextWidget,
} from 'netlify-cms-core';
// Backends
import { AzureBackend } from 'netlify-cms-backend-azure';
import { BitbucketBackend } from 'netlify-cms-backend-bitbucket';
import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway';
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { ProxyBackend } from 'netlify-cms-backend-proxy';
import { TestBackend } from 'netlify-cms-backend-test';
// Widgets
// Editor Components
import image from 'netlify-cms-editor-component-image';
// Locales
import * as locales from 'netlify-cms-locales';
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
  DateWidget.Widget(),
  DatetimeWidget.Widget(),
  CodeWidget.Widget(),
  ColorStringWidget.Widget(),
]);
CMS.registerEditorComponent(image);
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
