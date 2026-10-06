import styled from '@emotion/styled';
import React from 'react';
import Frame, { FrameContextConsumer } from 'react-frame-component';

import { getAllEntries, tryLoadEntry } from '@/core/actions/entries';
import { boundGetAsset } from '@/core/actions/media';
import { ErrorBoundary } from '@/core/components/UI';
import { INFERABLE_FIELDS } from '@/core/constants/fieldInference';
import { useAppDispatch, useAppSelector } from '@/core/hooks/useRedux';
import { useTranslate } from '@/core/i18n';
import { getPreviewStyles, getPreviewTemplate, getRemarkPlugins, resolveWidget } from '@/core/lib/registry';
import { attachShortcutTarget } from '@/core/lib/shortcuts';
import { encodeEntry } from '@/core/lib/stega';
import { selectField, selectInferredField, selectTemplateName } from '@/core/reducers/collections';
import { selectIsLoadingAsset } from '@/core/reducers/medias';
import { lengths } from '@/ui/default/index';
import EditorPreview from './EditorPreview';
import EditorPreviewContent from './EditorPreviewContent.js';
import PreviewHOC from './PreviewHOC';

import type { CmsCollectionState, CmsConfig, CmsEntry, CmsEntryField } from '@/lib/util/index';
import type { Dispatch } from 'redux';

type Collection = CmsCollectionState;
type EntryMap = CmsEntry;
type EntryField = CmsEntryField;

type State = any;

function isVisible(field: EntryField) {
  return field.widget !== 'hidden';
}

const PreviewPaneFrame = styled(Frame)`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  border-radius: ${lengths.borderRadius};
`;

type InferableFieldValue = (typeof INFERABLE_FIELDS)[keyof typeof INFERABLE_FIELDS];

/**
 * Routes keydown events from the preview iframe into the global shortcut
 * engine. Without this, keyboard focus inside the frame swallows every
 * shortcut — most noticeably mod+S, which falls through to the browser's
 * native "save page as" instead of saving the entry.
 */
function PreviewShortcutBridge({ frameWindow }: { frameWindow?: Window | null | undefined }) {
  React.useEffect(() => {
    if (!frameWindow) return undefined;
    return attachShortcutTarget(frameWindow);
  }, [frameWindow]);
  return null;
}

interface PreviewPaneProps {
  collection: Collection;
  fields: EntryField[];
  entry: EntryMap;
  fieldsMetaData: Record<string, unknown>;
  getAsset: (asset: string) => { url: string, path: string, field?: EntryField };
  onFieldClick?: (fieldName: string) => void;
  config: CmsConfig;
  state: State;
  isLoadingAsset: boolean;
  boundGetAsset: (collection: Collection, entry: EntryMap) => unknown;
  /**
   * DCMS-2134: the measured footprint (in CSS pixels) of the view-controls
   * icon row and the assistant pill that float, absolutely positioned, over
   * this pane's top-right corner. Reserved as dead space inside the preview
   * iframe so wrapped preview content (e.g. a long entry title's `<h1>`)
   * never renders underneath — and is thereby clipped by — that chrome.
   */
  previewChromeReserve?: { width: number, height: number };
}

function inferFieldsForCollection(collection: Collection): Record<string, InferableFieldValue> {
  const titleField = selectInferredField(collection, 'title');
  const shortTitleField = selectInferredField(collection, 'shortTitle');
  const authorField = selectInferredField(collection, 'author');
  const inferredFields: Record<string, InferableFieldValue> = {};
  if (titleField) inferredFields[titleField] = INFERABLE_FIELDS.title;
  if (shortTitleField) inferredFields[shortTitleField] = INFERABLE_FIELDS.shortTitle;
  if (authorField) inferredFields[authorField] = INFERABLE_FIELDS.author;
  return inferredFields;
}

// Exported for unit testing the `valueIsInMap` heuristic (DCMS-455).
export function getWidget(
  field: EntryField,
  value: unknown,
  metadata: unknown,
  props: PreviewPaneProps,
  idx: number | string | null = null,
) {
  // The `hidden` widget has no registered control/preview, so resolving it
  // would fall through to the generic "unknown widget" preview and leak a
  // "No preview for widget 'hidden'." notice. Hidden fields must never
  // produce preview output, regardless of which call site reaches here
  // (top-level widgetFor, singular nested fields, or the widgetsFor API
  // exposed to custom preview templates) or how deeply they're nested
  // inside list/object fields.
  if (!isVisible(field)) {
    return null;
  }

  const { getAsset, entry } = props;
  const widget = resolveWidget(field.widget);
  const key = idx ? field.name + '_' + idx : field.name;
  const valueIsInMap = value
    && !(widget as any)?.allowMapValue
    && typeof value === 'object'
    && value !== null
    && !Array.isArray(value);

  // Use an HOC to provide conditional updates for all previews. Preview
  // components receive plain objects/arrays and read them with plain access
  // (e.g. `entry.data.title`).
  return !widget?.preview ? null : (
    <PreviewHOC
      previewComponent={widget.preview as unknown as React.ComponentType<Record<string, unknown>>}
      key={key}
      field={field}
      getAsset={getAsset}
      value={valueIsInMap ? (value as Record<string, unknown>)[field.name] : (value as any)}
      {...({
        entry,
        fieldsMetaData: metadata as Record<string, unknown>,
        resolveWidget,
        getRemarkPlugins,
      } as any)}
    />
  );
}

export function PreviewPane(props: PreviewPaneProps) {
  const { entry, collection, config, onFieldClick, previewChromeReserve } = props;
  const t = useTranslate();

  const inferredFields = inferFieldsForCollection(collection);

  /**
   * Returns the widget component for a named field, and makes recursive calls
   * to retrieve components for nested and deeply nested fields, which occur in
   * object and list type fields. Used internally to retrieve widgets, and also
   * exposed for use in custom preview templates.
   */
  function widgetFor(
    name: string,
    fields: EntryField[] = props.fields,
    values: unknown = props.entry.data,
    fieldsMetaData: Record<string, unknown> = props.fieldsMetaData,
  ): React.ReactNode {
    let field = fields && fields.find(f => f.name === name);
    if (!field || !isVisible(field)) return null;

    let value: any = typeof values === 'object' && values !== null && !Array.isArray(values)
      ? (values as Record<string, unknown>)[field.name]
      : undefined;
    if (field.meta) {
      value = (props.entry.meta as Record<string, unknown>)?.[field.name];
    }

    const nestedFields = field.fields;
    const singleField = field.field;
    const metadata = fieldsMetaData && (fieldsMetaData[field.name] || {});

    if (nestedFields) {
      field = { ...field, fields: getNestedWidgets(nestedFields, value, metadata) as any };
    }

    if (singleField) {
      field = { ...field, field: getSingleNested(singleField, value, metadata) as any };
    }

    const labelledWidgets = ['string', 'text', 'number'];
    const inferredField = Object.entries(inferredFields)
      .filter(([key]) => {
        const fieldToMatch = selectField(props.collection, key);
        return fieldToMatch === field;
      })
      .map(([, v]) => v)[0];

    if (inferredField) {
      value = inferredField.defaultPreview(value);
    } else if (
      value
      && labelledWidgets.indexOf(field.widget) !== -1
      && value.toString().length < 50
    ) {
      value = (
        <div>
          <strong>{String((field as any).label || field.name)}:</strong> {String(value)}
        </div>
      );
    }

    return value ? getWidget(field, value, metadata, props) : null;
  }

  function getNestedWidgets(fields: EntryField[], values: unknown, fieldsMetaData: unknown) {
    if (Array.isArray(values)) {
      return values.map(value => widgetsForNestedFields(fields, value, fieldsMetaData as Record<string, unknown>));
    }
    return widgetsForNestedFields(fields, values, fieldsMetaData as Record<string, unknown>);
  }

  function getSingleNested(field: EntryField, values: unknown, fieldsMetaData: unknown) {
    if (Array.isArray(values)) {
      return values.map((value, idx) =>
        getWidget(
          field,
          value,
          (fieldsMetaData as Record<string, unknown>)?.[field.name],
          props,
          idx,
        )
      );
    }
    return getWidget(
      field,
      values,
      (fieldsMetaData as Record<string, unknown>)?.[field.name],
      props,
    );
  }

  function widgetsForNestedFields(
    fields: EntryField[],
    values: unknown,
    fieldsMetaData: Record<string, unknown>,
  ) {
    return fields.map((field: EntryField) => widgetFor(field.name, fields, values, fieldsMetaData));
  }

  /**
   * Exposes nested widgets for object and list fields to custom preview templates.
   */
  function widgetsFor(name: string) {
    const { fields, entry: e, fieldsMetaData } = props;
    const field = fields.find(f => f.name === name);
    const nestedFields = field && field.fields;
    const variableTypes = field && field.types;
    const fieldName = field?.name ?? '';
    const value = (e.data as Record<string, unknown>)?.[fieldName];
    const metadata = ((fieldsMetaData as Record<string, unknown>)?.[field?.name as string]
      || {}) as Record<string, unknown>;

    if (Array.isArray(value) && variableTypes) {
      return value.map(val => {
        const valueType = variableTypes.find(
          (t: EntryField) => t.name === (val as Record<string, unknown>).type,
        );
        const typeFields = valueType && valueType.fields;
        const widgets: Record<string, React.ReactNode> = {};
        if (typeFields) {
          typeFields.forEach((f: EntryField, i: number) => {
            widgets[f.name] = (
              <div key={i}>
                {getWidget(f, val, (metadata as Record<string, unknown>)[f.name], props)}
              </div>
            );
          });
        }
        return { data: val, widgets };
      });
    }

    if (Array.isArray(value)) {
      return value.map(val => {
        const widgets: Record<string, React.ReactNode> = {};
        if (nestedFields) {
          nestedFields.forEach((f: EntryField, i: number) => {
            widgets[f.name] = (
              <div key={i}>
                {getWidget(f, val, (metadata as Record<string, unknown>)[f.name], props)}
              </div>
            );
          });
        }
        return { data: val, widgets };
      });
    }

    const widgets: Record<string, React.ReactNode> = {};
    if (nestedFields) {
      nestedFields.forEach((f: EntryField) => {
        widgets[f.name] = getWidget(f, value, (metadata as Record<string, unknown>)[f.name], props);
      });
    }
    return { data: value, widgets };
  }

  async function getCollection(collectionName: string, slug?: string) {
    const { state } = props;
    const selectedCollection = state.collections[collectionName];

    if (typeof slug === 'undefined') {
      const entries = await getAllEntries(state, selectedCollection);
      return entries.map((e: { data: unknown, slug: unknown, path: unknown }) => ({
        data: e.data,
        slug: e.slug,
        path: e.path,
      }));
    }

    const e = await tryLoadEntry(state, selectedCollection, slug);
    return { data: e.data, slug: e.slug, path: e.path };
  }

  if (!entry || !entry.data) {
    return null;
  }

  // Collections without a registered preview template get the generic
  // preview: every visible field rendered through its widget's preview.
  const previewComponent = getPreviewTemplate(selectTemplateName(collection, entry.slug)) || EditorPreview;

  const visualEditing = (collection as any)?.editor?.visualEditing ?? false;

  // Only encode entry data if visual editing is enabled
  const previewEntry = visualEditing
    ? { ...entry, data: encodeEntry(entry.data, props.fields as any) }
    : entry;

  const previewProps = {
    ...props,
    // Custom preview templates receive plain objects/arrays and read them with
    // plain access (`entry.data.title`).
    entry: previewEntry,
    fieldsMetaData: props.fieldsMetaData,
    widgetFor: (
      name: string,
      fields?: EntryField[],
      values: unknown = previewEntry.data,
      fieldsMetaData?: Record<string, unknown>,
    ) => widgetFor(name, fields, values, fieldsMetaData),
    widgetsFor: (name: string) => widgetsFor(name),
    getCollection: (collectionName: string, slug?: string) => getCollection(collectionName, slug),
  };

  const styleEls = getPreviewStyles().map((style, i) => {
    if (style.raw) {
      return <style key={i}>{style.value}</style>;
    }
    return <link key={i} href={style.value} type="text/css" rel="stylesheet" />;
  });

  const initialContent = `
<!DOCTYPE html>
<html>
  <head>
    <base target="_blank"/>
    <style>
      /*
       * DCMS-NEW-PREVIEW-WRAP: preview content is arbitrary, user-supplied
       * markup (the demo PostPreview's <h1>{entry.data.title}</h1>, or any
       * other custom preview component). A long unbroken string (URL,
       * token, or just a huge title) has no natural break point, so without
       * this it overflows the iframe's initial containing block instead of
       * wrapping or scrolling.
       */
      html, body {
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
    </style>
  </head>
  <body><div></div></body>
</html>
`;

  return (
    <ErrorBoundary config={config}>
      <PreviewPaneFrame
        id="preview-pane"
        title={t('editor.editorInterface.previewPaneTitle')}
        head={styleEls}
        initialContent={initialContent}
      >
        <FrameContextConsumer>
          {({ document, window }) => (
            <>
              <PreviewShortcutBridge frameWindow={window} />
              <EditorPreviewContent
                previewComponent={previewComponent}
                previewProps={{ ...previewProps, document, window }}
                onFieldClick={onFieldClick}
                chromeReserve={previewChromeReserve}
              />
            </>
          )}
        </FrameContextConsumer>
      </PreviewPaneFrame>
    </ErrorBoundary>
  );
}

interface ConnectedPreviewPaneProps {
  collection: Collection;
  fields: EntryField[];
  entry: EntryMap;
  fieldsMetaData: Record<string, unknown>;
  onFieldClick?: (fieldName: string) => void;
  locale?: string;
  previewChromeReserve?: { width: number, height: number };
}

export default function ConnectedPreviewPane(props: ConnectedPreviewPaneProps) {
  const dispatch = useAppDispatch();
  const isLoadingAsset = useAppSelector((state: any) => selectIsLoadingAsset(state.medias));
  const config = useAppSelector((state: any) => state.config);
  const collections = useAppSelector((state: any) => state.collections);
  const integrations = useAppSelector((state: any) => state.integrations);
  const entries = useAppSelector((state: any) => state.entries);
  const mediaLibrary = useAppSelector((state: any) => state.mediaLibrary);
  const state = React.useMemo(
    () => ({ config, collections, integrations, entries, mediaLibrary }),
    [config, collections, integrations, entries, mediaLibrary],
  );
  const getAsset = React.useMemo(
    () => boundGetAsset(dispatch as any, props.collection, props.entry),
    [dispatch, props.collection, props.entry],
  );

  return (
    <PreviewPane
      {...props}
      isLoadingAsset={isLoadingAsset}
      config={config}
      state={state}
      boundGetAsset={(collection: Collection, entry: EntryMap) => boundGetAsset(dispatch as any, collection, entry)}
      getAsset={getAsset as (asset: string) => { url: string, path: string, field?: EntryField }}
    />
  );
}
