import PropTypes from 'prop-types';
import React from 'react';
import { List, Map } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Frame from 'react-frame-component';
import { resolveWidget, getPreviewTemplate, getPreviewStyles } from 'Lib/registry';
import { ErrorBoundary } from 'UI';
import { selectTemplateName, selectInferedField } from 'Reducers/collections';
import { INFERABLE_FIELDS } from 'Constants/fieldInference';
import EditorPreviewContent from './EditorPreviewContent.js';
import PreviewHOC from './PreviewHOC';
import EditorPreview from './EditorPreview';

export default class PreviewPane extends React.Component {

  getWidget = (field, value, props) => {
    const { fieldsMetaData, getAsset, entry } = props;
    const widget = resolveWidget(field.get('widget'));

    /**
     * Use an HOC to provide conditional updates for all previews.
     */
    return !widget.preview ? null : (
      <PreviewHOC
        previewComponent={widget.preview}
        key={field.get('name')}
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
    let nestedFields = field.get('fields');

    if (nestedFields) {
      field = field.set('fields', this.getNestedWidgets(nestedFields, value));
    }

    const labelledWidgets = ['string', 'text', 'number'];
    if (Object.keys(this.inferedFields).indexOf(name) !== -1) {
      value = this.inferedFields[name].defaultPreview(value);
    } else if (value && labelledWidgets.indexOf(field.get('widget')) !== -1 && value.toString().length < 50) {
      value = <div><strong>{field.get('label')}:</strong> {value}</div>;
    }

    return value ? this.getWidget(field, value, this.props) : null;
  };

  /**
   * Retrieves widgets for nested fields (children of object/list fields)
   */
  getNestedWidgets = (fields, values) => {
    // Fields nested within a list field will be paired with a List of value Maps.
    if (List.isList(values)) {
      return values.map(value => this.widgetsForNestedFields(fields, value));
    }
    // Fields nested within an object field will be paired with a single Map of values.
    return this.widgetsForNestedFields(fields, values);
  };

  /**
   * Use widgetFor as a mapping function for recursive widget retrieval
   */
  widgetsForNestedFields = (fields, values) => {
    return fields.map(field => this.widgetFor(field.get('name'), fields, values));
  };

  /**
   * This function exists entirely to expose nested widgets for object and list
   * fields to custom preview templates.
   *
   * TODO: see if widgetFor can now provide this functionality for preview templates
   */
  widgetsFor = (name) => {
    const { fields, entry } = this.props;
    const field = fields.find(f => f.get('name') === name);
    const nestedFields = field && field.get('fields');
    const value = entry.getIn(['data', field.get('name')]);

    if (List.isList(value)) {
      return value.map((val, index) => {
        const widgets = nestedFields && Map(nestedFields.map((f, i) => [f.get('name'), <div key={i}>{this.getWidget(f, val, this.props)}</div>]));
        return Map({ data: val, widgets });
      });
    };

    return Map({
      data: value,
      widgets: nestedFields && Map(nestedFields.map(f => [f.get('name'), this.getWidget(f, value, this.props)])),
    });
  };

  render() {
    const { entry, collection } = this.props;

    if (!entry || !entry.get('data')) {
      return null;
    }

    const previewComponent =
      getPreviewTemplate(selectTemplateName(collection, entry.get('slug'))) ||
      EditorPreview;

    this.inferFields();

    const previewProps = {
      ...this.props,
      widgetFor: this.widgetFor,
      widgetsFor: this.widgetsFor,
    };

    const styleEls = getPreviewStyles()
      .map((style, i) => {
        if (style.raw) {
          return <style key={i}>{style.value}</style>
        }
        return <link key={i} href={style.value} type="text/css" rel="stylesheet" />;
      });

    if (!collection) {
      return <Frame className="nc-previewPane-frame" head={styleEls} />;
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
        <Frame className="nc-previewPane-frame" head={styleEls} initialContent={initialContent}>
          <EditorPreviewContent {...{ previewComponent, previewProps }}/>
        </Frame>
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
