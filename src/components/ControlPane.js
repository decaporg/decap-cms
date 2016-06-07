import React from 'react';
import Widgets from './Widgets';

export default class ControlPane extends React.Component {
  controlFor(field) {
    const { entry } = this.props;
    const widget = Widgets[field.get('widget')] || Widgets._unknown;
    return React.createElement(widget.Control, {
      key: field.get('name'),
      field: field,
      value: entry.getIn(['data', field.get('name')]),
      onChange: (value) => this.props.onChange(entry.setIn(['data', field.get('name')], value)),
      onAddMedia: (mediaFile) => this.props.onAddMedia(mediaFile)
    });
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }

    return <div>
      {collection.get('fields').map((field) => <div key={field.get('names ')}>{this.controlFor(field)}</div>)}
    </div>;
  }
}
