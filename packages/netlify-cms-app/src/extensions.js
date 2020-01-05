// Core
import { NetlifyCmsCore as CMS } from 'netlify-cms-core';

// Backends
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway';
import { BitbucketBackend } from 'netlify-cms-backend-bitbucket';
import { TestBackend } from 'netlify-cms-backend-test';

// Widgets
import NetlifyCmsWidgetString from 'netlify-cms-widget-string';
import NetlifyCmsWidgetNumber from 'netlify-cms-widget-number';
import NetlifyCmsWidgetText from 'netlify-cms-widget-text';
import NetlifyCmsWidgetImage from 'netlify-cms-widget-image';
import NetlifyCmsWidgetFile from 'netlify-cms-widget-file';
import NetlifyCmsWidgetSelect from 'netlify-cms-widget-select';
import NetlifyCmsWidgetMarkdown from 'netlify-cms-widget-markdown';
import NetlifyCmsWidgetList from 'netlify-cms-widget-list';
import NetlifyCmsWidgetObject from 'netlify-cms-widget-object';
import NetlifyCmsWidgetRelation from 'netlify-cms-widget-relation';
import NetlifyCmsWidgetBoolean from 'netlify-cms-widget-boolean';
import NetlifyCmsWidgetMap from 'netlify-cms-widget-map';
import NetlifyCmsWidgetDate from 'netlify-cms-widget-date';
import NetlifyCmsWidgetDatetime from 'netlify-cms-widget-datetime';
import NetlifyCmsWidgetCode from 'netlify-cms-widget-code';

// Editor Components
import image from 'netlify-cms-editor-component-image';

// Locales
import * as locales from 'netlify-cms-locales';

// Register all the things
CMS.registerBackend('git-gateway', GitGatewayBackend);
CMS.registerBackend('github', GitHubBackend);
CMS.registerBackend('gitlab', GitLabBackend);
CMS.registerBackend('bitbucket', BitbucketBackend);
CMS.registerBackend('test-repo', TestBackend);
CMS.registerWidget([
  NetlifyCmsWidgetString.Widget(),
  NetlifyCmsWidgetNumber.Widget(),
  NetlifyCmsWidgetText.Widget(),
  NetlifyCmsWidgetImage.Widget(),
  NetlifyCmsWidgetFile.Widget(),
  NetlifyCmsWidgetSelect.Widget(),
  NetlifyCmsWidgetMarkdown.Widget(),
  NetlifyCmsWidgetList.Widget(),
  NetlifyCmsWidgetObject.Widget(),
  NetlifyCmsWidgetRelation.Widget(),
  NetlifyCmsWidgetBoolean.Widget(),
  NetlifyCmsWidgetMap.Widget(),
  NetlifyCmsWidgetDate.Widget(),
  NetlifyCmsWidgetDatetime.Widget(),
  NetlifyCmsWidgetCode.Widget(),
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
