import React, { PropTypes } from 'react';
import { List, Map } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Frame from 'react-frame-component';
import { ScrollSyncPane } from '../ScrollSync';
import registry from '../../lib/registry';
import { resolveWidget } from '../Widgets';
import { selectTemplateName, selectInferedField } from '../../reducers/collections';
import { INFERABLE_FIELDS } from '../../constants/fieldInference';
import Preview from './Preview';
import styles from './PreviewPane.css';

export default class PreviewPane extends React.Component {

  getWidget = (field, value, props) => {
    const { fieldsMetaData, getAsset } = props;
    const widget = resolveWidget(field.get('widget'));

    return !widget.preview ? null : React.createElement(widget.preview, {
      field,
      key: field.get('name'),
      value: value && Map.isMap(value) ? value.get(field.get('name')) : value,
      metadata: fieldsMetaData && fieldsMetaData.get(field.get('name')),
      getAsset,
    });
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

    const component = registry.getPreviewTemplate(selectTemplateName(collection, entry.get('slug'))) || Preview;

    this.inferFields();

    const previewProps = {
      ...this.props,
      widgetFor: this.widgetFor,
      widgetsFor: this.widgetsFor,
    };

    const styleEls = registry.getPreviewStyles()
       .map((style, i) => <link key={i} href={style} type="text/css" rel="stylesheet" />);

    if (!collection) {
      return <Frame className={styles.frame} head={styleEls} />;
    }

    // We need to create a lightweight component here so that we can
    // access the context within the Frame. This allows us to attach
    // the ScrollSyncPane to the body.
    const PreviewContent = (props, { document: iFrameDocument }) => (
      <ScrollSyncPane attachTo={iFrameDocument.scrollingElement}>
        {React.createElement(component, previewProps)}
      </ScrollSyncPane>);

    PreviewContent.contextTypes = {
      document: PropTypes.any,
    };

    return (<Frame
      className={styles.frame}
      head={styleEls}
      initialContent={`
<!DOCTYPE html>
<html>
  <head><base target="_blank"/></head>
  <body><div></div></body>
</html>`}
    ><PreviewContent /></Frame>);
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  getAsset: PropTypes.func.isRequired,
};
