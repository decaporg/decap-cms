import PropTypes from 'prop-types';
import React from 'react';
import styled from 'react-emotion';
import { List, Map } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Frame from 'react-frame-component';
import { lengths } from 'netlify-cms-ui-default';
import { resolveWidget, getPreviewTemplate, getPreviewStyles } from 'Lib/registry';
import { ErrorBoundary } from 'UI';
import { selectTemplateName, selectInferedField } from 'Reducers/collections';
import { INFERABLE_FIELDS } from 'Constants/fieldInference';
import EditorPreviewContent from './EditorPreviewContent.js';
import PreviewHOC from './PreviewHOC';
import EditorPreview from './EditorPreview';
import { TYPES_KEY, resolveFunctionForMixedField } from 'netlify-cms-lib-util';

const PreviewPaneFrame = styled(Frame)`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  border-radius: ${lengths.borderRadius};
`;

const nestedListStyle = {
  marginTop: 0,
  paddingLeft: '2em',
};

export default class PreviewPane extends React.Component {
  getWidget = (field, value, props, idx = null) => {
    const { fieldsMetaData, getAsset, entry } = props;
    const widget = resolveWidget(field.get('widget'));
    const key = idx ? field.get('name') + '_' + idx : field.get('name');

    /**
     * Use an HOC to provide conditional updates for all previews.
     */
    return !widget.preview ? null : (
      <PreviewHOC
        previewComponent={widget.preview}
        key={key}
        field={field}
        getAsset={getAsset}
        value={value && Map.isMap(value) ? value.get(field.get('name')) : value}
        metadata={fieldsMetaData && fieldsMetaData.get(field.get('name'))}
        entry={entry}
        fieldsMetaData={fieldsMetaData}
      />
    );
  };

  inferedFields = {};

  inferFields() {
    const titleField = selectInferedField(this.props.collection, 'title');
    const shortTitleField = selectInferedField(this.props.collection, 'shortTitle');
    const authorField = selectInferedField(this.props.collection, 'author');

    this.inferedFields = {};
    if (titleField) this.inferedFields[titleField] = INFERABLE_FIELDS.title;
    if (shortTitleField) this.inferedFields[shortTitleField] = INFERABLE_FIELDS.shortTitle;
    if (authorField) this.inferedFields[authorField] = INFERABLE_FIELDS.author;
  }

  /**
   * Returns the widget component for a named field, and makes recursive calls
   * to retrieve components for nested and deeply nested fields, which occur in
   * object and list type fields. Used internally to retrieve widgets, and also
   * exposed for use in custom preview templates.
   */
  widgetFor = (name, fields = this.props.fields, values = this.props.entry.get('data')) => {
    // We retrieve the field by name so that this function can also be used in
    // custom preview templates, where the field object can't be passed in.
    let field = fields && fields.find(f => f.get('name') === name);
    let value = values && values.get(field.get('name'));
    let mixedWidgets = field.get(TYPES_KEY);
    let nestedFields = field.get('fields');
    let singleField = field.get('field');

    if (mixedWidgets) {
      field = field.set(TYPES_KEY, this.getMixedWidgets(field, value));
    }

    if (nestedFields) {
      field = field.set('fields', this.getNestedWidgets(nestedFields, value));
    }

    if (singleField) {
      field = field.set('field', this.getSingleNested(singleField, value));
    }

    const labelledWidgets = ['string', 'text', 'number'];
    if (Object.keys(this.inferedFields).indexOf(name) !== -1) {
      value = this.inferedFields[name].defaultPreview(value);
    } else if (labelledWidgets.indexOf(field.get('widget')) !== -1) {
      value = (
        <div>
          <strong>{field.get('label', field.get('name'))}:</strong>{' '}
          {value && value.toString().length < 50 ? (
            value
          ) : (
            <span style={{ color: '#666666' }}>{'undefined'}</span>
          )}
        </div>
      );
    }

    return value ? this.getWidget(field, value, this.props) : null;
  };

  getMixedWidgets = (field, values) => {
    const mixedFieldResolver = resolveFunctionForMixedField(field);
    if (!values) {
      return null;
    } else if (List.isList(values)) {
      return (
        <ul style={nestedListStyle}>
          {values.map((value, idx) => {
            const field = mixedFieldResolver(value);
            const fields = field.get('fields');
            return (
              <li key={idx}>
                <span>{`Item ${idx + 1} [${field.get('label', field.get('name'))}]:`}</span>{' '}
                {this.getNestedWidgets(fields, value)}
              </li>
            );
          })}
        </ul>
      );
    } else {
      const fields = mixedFieldResolver(values).get('fields');
      return this.getNestedWidgets(fields, values);
    }
  };

  /**
   * Retrieves widgets for nested fields (children of object/list fields)
   */
  getNestedWidgets = (fields, values) => {
    // Fields nested within a list field will be paired with a List of value Maps.
    if (List.isList(values)) {
      return (
        <ul style={nestedListStyle}>
          {values.map((value, idx) => (
            <li key={idx}>
              <span>Item {idx + 1}:</span> {this.widgetsForNestedFields(fields, value)}
            </li>
          ))}
        </ul>
      );
    }
    // Fields nested within an object field will be paired with a single Map of values.
    return this.widgetsForNestedFields(fields, values);
  };

  /**
   * Use widgetFor as a mapping function for recursive widget retrieval
   */
  widgetsForNestedFields = (fields, values) => {
    return (
      <ul style={nestedListStyle}>
        {fields.map((field, idx) => (
          <li key={idx}>{this.widgetFor(field.get('name'), fields, values)}</li>
        ))}
      </ul>
    );
  };

  getSingleNested = (field, values) => {
    if (List.isList(values)) {
      return (
        <ul style={nestedListStyle}>
          {values.map((value, idx) => (
            <li key={idx}>
              <span>Item {idx + 1}:</span> {this.getWidget(field, value, this.props, idx)}
            </li>
          ))}
        </ul>
      );
    }
    return this.getWidget(field, values, this.props);
  };

  /**
   * This function exists entirely to expose nested widgets for object and list
   * fields to custom preview templates.
   *
   * TODO: see if widgetFor can now provide this functionality for preview templates
   */
  widgetsFor = name => {
    const { fields, entry } = this.props;
    const field = fields.find(f => f.get('name') === name);
    const mixedWidgets = field && field.get(TYPES_KEY);
    const mixedFieldResolver = mixedWidgets && resolveFunctionForMixedField(field);
    const value = entry.getIn(['data', field.get('name')]);
    let nestedFields = field && field.get('fields');

    if (List.isList(value)) {
      return value.map(val => {
        if (mixedFieldResolver) {
          nestedFields = mixedFieldResolver(val).get('fields');
        }
        const widgets =
          nestedFields &&
          Map(
            nestedFields.map((f, i) => [
              f.get('name'),
              <div key={i}>{this.getWidget(f, val, this.props)}</div>,
            ]),
          );
        return Map({ data: val, widgets });
      });
    }

    if (mixedFieldResolver) {
      nestedFields = mixedFieldResolver(value).get('fields');
    }

    return Map({
      data: value,
      widgets:
        nestedFields &&
        Map(nestedFields.map(f => [f.get('name'), this.getWidget(f, value, this.props)])),
    });
  };

  render() {
    const { entry, collection } = this.props;

    if (!entry || !entry.get('data')) {
      return null;
    }

    const previewComponent =
      getPreviewTemplate(selectTemplateName(collection, entry.get('slug'))) || EditorPreview;

    this.inferFields();

    const previewProps = {
      ...this.props,
      widgetFor: this.widgetFor,
      widgetsFor: this.widgetsFor,
    };

    const styleEls = getPreviewStyles().map((style, i) => {
      if (style.raw) {
        return <style key={i}>{style.value}</style>;
      }
      return <link key={i} href={style.value} type="text/css" rel="stylesheet" />;
    });

    if (!collection) {
      <PreviewPaneFrame head={styleEls} />;
    }

    const initialContent = `
<!DOCTYPE html>
<html>
  <head><base target="_blank"/></head>
  <body><div></div></body>
</html>
`;

    return (
      <ErrorBoundary>
        <PreviewPaneFrame head={styleEls} initialContent={initialContent}>
          <EditorPreviewContent {...{ previewComponent, previewProps }} />
        </PreviewPaneFrame>
      </ErrorBoundary>
    );
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  getAsset: PropTypes.func.isRequired,
};
