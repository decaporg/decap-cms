import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

function isVisible(field) {
  return field.get('widget') !== 'hidden';
}

const style = {
  fontFamily: 'Roboto, "Helvetica Neue", HelveticaNeue, Helvetica, Arial, sans-serif',
};

/**
 * Use a stateful component so that child components can effectively utilize
 * `shouldComponentUpdate`.
 */
export default class Preview extends React.Component {
  render() {
    const { collection, fields, widgetFor } = this.props;
    if (!collection || !fields) {
      return null;
    }
    return (
      <div style={style}>
        {fields.filter(isVisible).map(field => widgetFor(field.get('name')))}
      </div>
    );
  }
}

Preview.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  getAsset: PropTypes.func.isRequired,
  widgetFor: PropTypes.func.isRequired,
};
