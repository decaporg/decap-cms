import React, { PropTypes, Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';

export default class ObjectPreview extends Component {
  widgetFor = (field) => {
    const { value, getAsset } = this.props;
    const widget = resolveWidget(field.get('widget'));
    return (
      <div key={field.get('name')}>
        {React.createElement(widget.preview, {
          key: field.get('name'),
          value: value && value.get(field.get('name')),
          field,
          getAsset,
        })}
      </div>
    );
  };

  render() {
    const { field } = this.props;
    const fields = field && field.get('fields');

    return <div style={previewStyle}>{fields ? fields.map(f => this.widgetFor(f)) : null}</div>;
  }
}

ObjectPreview.propTypes = {
  value: PropTypes.node,
  field: PropTypes.node,
  getAsset: PropTypes.func.isRequired,
};
