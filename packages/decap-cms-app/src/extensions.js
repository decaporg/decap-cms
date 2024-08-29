// Core
import { DecapCmsCore as CMS } from 'decap-cms-core';
// Backends
import { AzureBackend } from 'decap-cms-backend-azure';
import { AwsCognitoGitHubProxyBackend } from 'decap-cms-backend-aws-cognito-github-proxy';
import { GitHubBackend } from 'decap-cms-backend-github';
import { GitLabBackend } from 'decap-cms-backend-gitlab';
import { GiteaBackend } from 'decap-cms-backend-gitea';
import { GitGatewayBackend } from 'decap-cms-backend-git-gateway';
import { BitbucketBackend } from 'decap-cms-backend-bitbucket';
import { TestBackend } from 'decap-cms-backend-test';
import { ProxyBackend } from 'decap-cms-backend-proxy';
// Widgets
import DecapCmsWidgetString from 'decap-cms-widget-string';
import DecapCmsWidgetNumber from 'decap-cms-widget-number';
import DecapCmsWidgetText from 'decap-cms-widget-text';
import DecapCmsWidgetImage from 'decap-cms-widget-image';
import DecapCmsWidgetFile from 'decap-cms-widget-file';
import DecapCmsWidgetSelect from 'decap-cms-widget-select';
import DecapCmsWidgetMarkdown from 'decap-cms-widget-markdown';
import DecapCmsWidgetList from 'decap-cms-widget-list';
import DecapCmsWidgetObject from 'decap-cms-widget-object';
import DecapCmsWidgetRelation from 'decap-cms-widget-relation';
import DecapCmsWidgetBoolean from 'decap-cms-widget-boolean';
import DecapCmsWidgetMap from 'decap-cms-widget-map';
import DecapCmsWidgetDatetime from 'decap-cms-widget-datetime';
import DecapCmsWidgetCode from 'decap-cms-widget-code';
import DecapCmsWidgetColorString from 'decap-cms-widget-colorstring';
// Editor Components
import image from 'decap-cms-editor-component-image';
// Locales
import * as locales from 'decap-cms-locales';

// Register all the things
CMS.registerBackend('git-gateway', GitGatewayBackend);
CMS.registerBackend('azure', AzureBackend);
CMS.registerBackend('aws-cognito-github-proxy', AwsCognitoGitHubProxyBackend);
CMS.registerBackend('github', GitHubBackend);
CMS.registerBackend('gitlab', GitLabBackend);
CMS.registerBackend('gitea', GiteaBackend);
CMS.registerBackend('bitbucket', BitbucketBackend);
CMS.registerBackend('test-repo', TestBackend);
CMS.registerBackend('proxy', ProxyBackend);
CMS.registerWidget([
  DecapCmsWidgetString.Widget(),
  DecapCmsWidgetNumber.Widget(),
  DecapCmsWidgetText.Widget(),
  DecapCmsWidgetImage.Widget(),
  DecapCmsWidgetFile.Widget(),
  DecapCmsWidgetSelect.Widget(),
  DecapCmsWidgetMarkdown.Widget(),
  DecapCmsWidgetList.Widget(),
  DecapCmsWidgetObject.Widget(),
  DecapCmsWidgetRelation.Widget(),
  DecapCmsWidgetBoolean.Widget(),
  DecapCmsWidgetMap.Widget(),
  DecapCmsWidgetDatetime.Widget(),
  DecapCmsWidgetCode.Widget(),
  DecapCmsWidgetColorString.Widget(),
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
