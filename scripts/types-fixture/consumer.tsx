/**
 * Consumer smoke test for the published typings.
 *
 * This file is type-checked against the *built* declarations in
 * packages/*\/dist/esm, exactly as an external TypeScript user would consume
 * them. It exists so that the public API surface cannot silently drift away
 * from the implementation again — the failure mode that motivated #7410.
 *
 * Run via `pnpm run test:types` (which builds first). Nothing here executes.
 */
import CMS from 'decap-cms-app';

import type {
  CmsBackendClass,
  CmsCollection,
  CmsField,
  CmsWidgetControlProps,
  CmsWidgetPreviewProps,
  EditorComponentOptions,
} from 'decap-cms-app';

// --- init ------------------------------------------------------------------
CMS.init();
CMS.init({
  config: {
    backend: { name: 'git-gateway' },
    collections: [
      {
        name: 'posts',
        label: 'Posts',
        folder: 'content/posts',
        fields: [{ name: 'title', label: 'Title', widget: 'string' }],
      },
    ],
  },
});

// --- registerWidget: all three documented call shapes (#7410) --------------
function Control(props: Partial<CmsWidgetControlProps<string>>) {
  props.onChange?.('x');
  return null;
}
function Preview(props: Partial<CmsWidgetPreviewProps<string>>) {
  return <span>{String(props.value)}</span>;
}

CMS.registerWidget('simple', Control, Preview);
CMS.registerWidget('reuses-another-control', 'simple', Preview);
CMS.registerWidget({ name: 'from-object', controlComponent: Control, previewComponent: Preview });
CMS.registerWidget([
  { name: 'from-array-a', controlComponent: Control },
  { name: 'from-array-b', controlComponent: Control },
]);

// --- widget lookup ---------------------------------------------------------
CMS.getWidget('simple');
CMS.resolveWidget('simple');
const widgets = CMS.getWidgets();
widgets.forEach(w => w.name.toLowerCase());

// --- backends --------------------------------------------------------------
declare const MyBackend: CmsBackendClass;
CMS.registerBackend('my-backend', MyBackend);
CMS.getBackend('my-backend');

// --- editor components -----------------------------------------------------
const component: EditorComponentOptions = {
  id: 'demo',
  label: 'Demo',
  pattern: /^demo$/,
  fields: [{ name: 'text', label: 'Text', widget: 'string' }],
  fromBlock: match => ({ text: match[0] }),
  toBlock: data => String(data.text),
  toPreview: (data, getAsset, fields) => {
    // `fields` is absent when a component is previewed outside the editor.
    const field = fields?.find(f => f.get('widget') === 'image');
    return <span title={String(getAsset('/img.png', field))}>{String(data.text)}</span>;
  },
};
CMS.registerEditorComponent(component);

// `fields` comes back as an Immutable List of Immutable Maps, not an array.
const registered = CMS.getEditorComponents().get('demo');
registered?.fields.first()?.get('widget');

// --- events ----------------------------------------------------------------
function onPreSave({ entry }: { entry: unknown }) {
  return entry;
}
CMS.registerEventListener({ name: 'preSave', handler: onPreSave }, { some: 'option' });
CMS.getEventListeners('preSave');
CMS.removeEventListener({ name: 'preSave', handler: onPreSave });
CMS.removeEventListener({ name: 'preSave' });

// --- preview styles and templates ------------------------------------------
CMS.registerPreviewStyle('/styles.css');
CMS.registerPreviewStyle('body { color: red }', { raw: true });
CMS.registerPreviewTemplate('posts', props => <div>{String(props.entry)}</div>);
CMS.getPreviewStyles();
CMS.getPreviewTemplate('posts');

// --- locales, media libraries, serializers, formats ------------------------
CMS.registerLocale('xx', {});
CMS.getLocale('xx');
CMS.registerMediaLibrary({ name: 'lib' }, { config: {} });
CMS.getMediaLibrary('lib');
CMS.registerWidgetValueSerializer('simple', {});
CMS.getWidgetValueSerializer('simple');
CMS.registerCustomFormat('custom', 'ext', {
  fromFile: text => JSON.parse(text),
  toFile: data => JSON.stringify(data),
});
CMS.getCustomFormats();
const extensions: Record<string, string> = CMS.getCustomFormatsExtensions();
CMS.getCustomFormatsFormatters();
extensions.custom?.toUpperCase();

// --- remark plugins --------------------------------------------------------
CMS.registerRemarkPlugin(() => undefined);
CMS.getRemarkPlugins();

// --- config types are exported and usable ----------------------------------
export const collection: CmsCollection = {
  name: 'posts',
  label: 'Posts',
  folder: 'content/posts',
  fields: [{ name: 'title', label: 'Title', widget: 'string' }] as CmsField[],
};
