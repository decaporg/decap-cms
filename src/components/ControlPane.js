import React from 'react';
import Widgets from './Widgets';

export default class ControlPane extends React.Component {
  controlFor(field) {
    const { entry } = this.props;
    const widget = Widgets[field.get('widget')] || Widgets._unknown;
    return React.createElement(widget.Control, {
      key: field.get('name'),
      field: field,
      value: entry.get(field.get('name')),
      onChange: (value) => this.props.onChange(entry.set(field.get('name'), value))
    });
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }

    return <div>
      {collection.get('fields').map((field) => <div>{this.controlFor(field)}</div>)}
    </div>;
  }
}
