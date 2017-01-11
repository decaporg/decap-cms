import React, { PropTypes, Component } from 'react';
import { resolveWidget } from '../Widgets';
import previewStyle from './defaultPreviewStyle';

export default class ListPreview extends Component {
  widgetFor = (field, value) => {
    const { getAsset } = this.props;
    const widget = resolveWidget(field.get('widget'));
    return (<div key={field.get('name')}>{React.createElement(widget.preview, {
      key: field.get('name'),
      value: value && value.get(field.get('name')),
      field,
      getAsset,
    })}</div>);
  };

  render() {
    const { field, value } = this.props;
    const fields = field && field.get('fields');
    if (fields) {
      return value ? (<div style={previewStyle}>
        {value.map((val, index) => <div key={index}>
          {fields && fields.map(f => this.widgetFor(f, val))}
        </div>)}
      </div>) : null;
    }

    return <div style={previewStyle}>{value ? value.join(', ') : null}</div>;
  }
}

ListPreview.propTypes = {
  value: PropTypes.node,
  field: PropTypes.node,
  getAsset: PropTypes.func.isRequired,
};
