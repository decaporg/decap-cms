import React from 'react';
import Widgets from './Widgets';

export default class PreviewPane extends React.Component {
  previewFor(field) {
    const { entry, getMedia } = this.props;
    const widget = Widgets[field.get('widget')] || Widgets._unknown;
    return React.createElement(widget.Preview, {
      key: field.get('name'),
      field: field,
      value: entry.getIn(['data', field.get('name')]),
      getMedia: getMedia,
    });
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }

    return <div>
      {collection.get('fields').map((field) => <div>{this.previewFor(field)}</div>)}
    </div>;
  }
}
