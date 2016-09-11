import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Widgets from './Widgets';

export default class ControlPane extends React.Component {
  controlFor(field) {
    const { entry, getMedia, onChange, onAddMedia, onRemoveMedia } = this.props;
    const widget = Widgets[field.get('widget')] || Widgets._unknown;
    return <div className="cms-control">
      <label>{ field.get('label') }</label>
      {React.createElement(widget.Control, {
        field: field,
        value: entry.getIn(['data', field.get('name')]),
        onChange: (value) => onChange(entry.setIn(['data', field.get('name')], value)),
        onAddMedia: onAddMedia,
        onRemoveMedia: onRemoveMedia,
        getMedia: getMedia
      })}
    </div>;
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }
    return <div>
      {collection.get('fields').map((field) => <div key={field.get('name')}>{this.controlFor(field)}</div>)}
    </div>;
  }
}

ControlPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
  onAddMedia: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemoveMedia: PropTypes.func.isRequired,
};
