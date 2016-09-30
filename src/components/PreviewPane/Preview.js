import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { resolveWidget } from '../Widgets';

export default class Preview extends React.Component {

  previewFor(field) {
    const { entry, getMedia } = this.props;
    const widget = resolveWidget(field.get('widget'));
    return React.createElement(widget.preview, {
      field: field,
      value: entry.getIn(['data', field.get('name')]),
      getMedia: getMedia,
    });
  }

  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return <div>
      {
        collection.get('fields').map(field => (
          <div key={field.get('name')}>
            {this.previewFor(field)}
          </div>
        ))
      }
    </div>;
  }
}

Preview.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  getMedia: PropTypes.func.isRequired,
};
