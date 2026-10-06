// Core
import { once } from 'lodash-es';

import { DecapCmsCore as CMS } from '@/core/index';
// Entry codecs (whole-entry-file encodings)
import { jsonEntryCodec, jsonFrontmatterCodec } from '@/entry-codecs/json/index';
import { createMarkdownEntryCodec } from '@/entry-codecs/markdown/index';
import { tomlEntryCodec, tomlFrontmatterCodec } from '@/entry-codecs/toml/index';
import { yamlEntryCodec, yamlFrontmatterCodec } from '@/entry-codecs/yaml/index';
// Backends
import { AzureBackend } from '@/backends/azure/index';
import { BitbucketBackend } from '@/backends/bitbucket/index';
import { ForgejoBackend } from '@/backends/forgejo/index';
import { GitGatewayBackend } from '@/backends/git-gateway/index';
import { GiteaBackend } from '@/backends/gitea/index';
import { GitHubBackend } from '@/backends/github/index';
import { GitLabBackend } from '@/backends/gitlab/index';
import { LocalFsBackend } from '@/backends/local-fs/index';
import { ProxyBackend } from '@/backends/proxy/index';
import { TestBackend } from '@/backends/test/index';
// Widgets
import DecapCmsWidgetBoolean from '@/widgets/boolean/index';
import DecapCmsWidgetCode from '@/widgets/code/index';
import DecapCmsWidgetColorString from '@/widgets/colorstring/index';
import DecapCmsWidgetDatetime from '@/widgets/datetime/index';
import DecapCmsWidgetFile from '@/widgets/file/index';
import DecapCmsWidgetImage from '@/widgets/image/index';
import DecapCmsWidgetList from '@/widgets/list/index';
import DecapCmsWidgetMap from '@/widgets/map/index';
import DecapCmsWidgetNumber from '@/widgets/number/index';
import DecapCmsWidgetObject from '@/widgets/object/index';
import DecapCmsWidgetRelation from '@/widgets/relation/index';
import DecapCmsWidgetRichtext, { imageEditorComponent, registerEditorComponent } from '@/widgets/richtext/index';
import DecapCmsWidgetSelect from '@/widgets/select/index';
import DecapCmsWidgetString from '@/widgets/string/index';
import DecapCmsWidgetText from '@/widgets/text/index';
import DecapCmsWidgetUuid from '@/widgets/uuid/index';
// Locales
import * as locales from '@/locales/index';

import type { CmsLocalePhrases } from '@/lib/util/types/cms/common.js';

/**
 * Register every built-in backend, widget, entry codec, and locale on the
 * Registry. Explicit and idempotent (lodash `once`): no module in this
 * package registers anything at import time; the entry point calls this.
 */
export const registerExtensions = once(function registerExtensions(): void {
  // Register all the things
  CMS.registerBackend('git-gateway', GitGatewayBackend);
  CMS.registerBackend('azure', AzureBackend);
  CMS.registerBackend('github', GitHubBackend);
  CMS.registerBackend('gitlab', GitLabBackend);
  CMS.registerBackend('gitea', GiteaBackend);
  CMS.registerBackend('forgejo', ForgejoBackend);
  CMS.registerBackend('bitbucket', BitbucketBackend);
  CMS.registerBackend('test-repo', TestBackend);
  CMS.registerBackend('proxy', ProxyBackend);
  CMS.registerBackend('local-fs', LocalFsBackend);
  [
    DecapCmsWidgetString.Widget(),
    DecapCmsWidgetNumber.Widget(),
    DecapCmsWidgetText.Widget(),
    DecapCmsWidgetImage.Widget(),
    DecapCmsWidgetFile.Widget(),
    DecapCmsWidgetSelect.Widget(),
    DecapCmsWidgetList.Widget(),
    DecapCmsWidgetObject.Widget(),
    DecapCmsWidgetRelation.Widget(),
    DecapCmsWidgetBoolean.Widget(),
    DecapCmsWidgetMap.Widget(),
    DecapCmsWidgetDatetime.Widget(),
    DecapCmsWidgetCode.Widget(),
    DecapCmsWidgetColorString.Widget(),
    DecapCmsWidgetUuid.Widget(),
    DecapCmsWidgetRichtext.Widget(),
    // `markdown` is a back-compat alias for `richtext`: same control, same
    // serializers, so a v3 config keeps loading. `resolveWidget` warns once
    // when it is used.
    DecapCmsWidgetRichtext.Widget({ name: 'markdown' }),
  ].forEach(widget => CMS.registerWidget(widget));
  // The default "Image" editor component, so richtext fields can insert
  // images out of the box, as in upstream Decap.
  registerEditorComponent(imageEditorComponent);

  // Entry codecs (whole-entry-file encodings) are registerable too; bare
  // consumers register only what their collections use. The markdown codec
  // (frontmatter + opaque body) is built explicitly with its frontmatter
  // languages: fences are tried in the order given, and the first language
  // is the default when writing.
  CMS.registerEntryCodec(yamlEntryCodec);
  CMS.registerEntryCodec(tomlEntryCodec);
  CMS.registerEntryCodec(jsonEntryCodec);
  CMS.registerEntryCodec(
    createMarkdownEntryCodec({ frontmatter: [yamlFrontmatterCodec, tomlFrontmatterCodec, jsonFrontmatterCodec] }),
  );
  Object.keys(locales).forEach(locale => {
    CMS.registerLocale(locale, (locales as Record<string, CmsLocalePhrases>)[locale]);
  });
});
