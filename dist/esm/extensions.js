"use strict";

var _decapCmsCore = require("decap-cms-core");
var _decapCmsBackendAzure = require("decap-cms-backend-azure");
var _decapCmsBackendGithub = require("decap-cms-backend-github");
var _decapCmsBackendGitlab = require("decap-cms-backend-gitlab");
var _decapCmsBackendGitGateway = require("decap-cms-backend-git-gateway");
var _decapCmsBackendBitbucket = require("decap-cms-backend-bitbucket");
var _decapCmsBackendTest = require("decap-cms-backend-test");
var _decapCmsBackendProxy = require("decap-cms-backend-proxy");
var _decapCmsWidgetString = _interopRequireDefault(require("decap-cms-widget-string"));
var _decapCmsWidgetNumber = _interopRequireDefault(require("decap-cms-widget-number"));
var _decapCmsWidgetText = _interopRequireDefault(require("decap-cms-widget-text"));
var _decapCmsWidgetImage = _interopRequireDefault(require("decap-cms-widget-image"));
var _decapCmsWidgetFile = _interopRequireDefault(require("decap-cms-widget-file"));
var _decapCmsWidgetSelect = _interopRequireDefault(require("decap-cms-widget-select"));
var _decapCmsWidgetMarkdown = _interopRequireDefault(require("decap-cms-widget-markdown"));
var _decapCmsWidgetList = _interopRequireDefault(require("decap-cms-widget-list"));
var _decapCmsWidgetObject = _interopRequireDefault(require("decap-cms-widget-object"));
var _decapCmsWidgetRelation = _interopRequireDefault(require("decap-cms-widget-relation"));
var _decapCmsWidgetBoolean = _interopRequireDefault(require("decap-cms-widget-boolean"));
var _decapCmsWidgetMap = _interopRequireDefault(require("decap-cms-widget-map"));
var _decapCmsWidgetDatetime = _interopRequireDefault(require("decap-cms-widget-datetime"));
var _decapCmsWidgetCode = _interopRequireDefault(require("decap-cms-widget-code"));
var _decapCmsWidgetColorstring = _interopRequireDefault(require("decap-cms-widget-colorstring"));
var _decapCmsEditorComponentImage = _interopRequireDefault(require("decap-cms-editor-component-image"));
var locales = _interopRequireWildcard(require("decap-cms-locales"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Core

// Backends

// Widgets

// Editor Components

// Locales

// Register all the things
_decapCmsCore.DecapCmsCore.registerBackend('git-gateway', _decapCmsBackendGitGateway.GitGatewayBackend);
_decapCmsCore.DecapCmsCore.registerBackend('azure', _decapCmsBackendAzure.AzureBackend);
_decapCmsCore.DecapCmsCore.registerBackend('github', _decapCmsBackendGithub.GitHubBackend);
_decapCmsCore.DecapCmsCore.registerBackend('gitlab', _decapCmsBackendGitlab.GitLabBackend);
_decapCmsCore.DecapCmsCore.registerBackend('bitbucket', _decapCmsBackendBitbucket.BitbucketBackend);
_decapCmsCore.DecapCmsCore.registerBackend('test-repo', _decapCmsBackendTest.TestBackend);
_decapCmsCore.DecapCmsCore.registerBackend('proxy', _decapCmsBackendProxy.ProxyBackend);
_decapCmsCore.DecapCmsCore.registerWidget([_decapCmsWidgetString.default.Widget(), _decapCmsWidgetNumber.default.Widget(), _decapCmsWidgetText.default.Widget(), _decapCmsWidgetImage.default.Widget(), _decapCmsWidgetFile.default.Widget(), _decapCmsWidgetSelect.default.Widget(), _decapCmsWidgetMarkdown.default.Widget(), _decapCmsWidgetList.default.Widget(), _decapCmsWidgetObject.default.Widget(), _decapCmsWidgetRelation.default.Widget(), _decapCmsWidgetBoolean.default.Widget(), _decapCmsWidgetMap.default.Widget(), _decapCmsWidgetDatetime.default.Widget(), _decapCmsWidgetCode.default.Widget(), _decapCmsWidgetColorstring.default.Widget()]);
_decapCmsCore.DecapCmsCore.registerEditorComponent(_decapCmsEditorComponentImage.default);
_decapCmsCore.DecapCmsCore.registerEditorComponent({
  id: 'code-block',
  label: 'Code Block',
  widget: 'code',
  type: 'code-block'
});
Object.keys(locales).forEach(locale => {
  _decapCmsCore.DecapCmsCore.registerLocale(locale, locales[locale]);
});