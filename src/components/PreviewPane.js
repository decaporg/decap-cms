import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Widgets from './Widgets';

export default class PreviewPane extends React.Component {
  previewFor(field) {
    const { entry, getMedia } = this.props;
    const widget = Widgets[field.get('widget')] || Widgets._unknown;
    return React.createElement(widget.Preview, {
      field: field,
      value: entry.getIn(['data', field.get('name')]),
      getMedia: getMedia,
    });
  }

  render() {
    const { collection } = this.props;
    if (!collection) { return null; }


    return <div>
      {collection.get('fields').map((field) => <div key={field.get('name')}>{this.previewFor(field)}</div>)}
    </div>;
  }
}

PreviewPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
};
