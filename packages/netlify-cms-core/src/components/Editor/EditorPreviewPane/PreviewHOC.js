import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

class PreviewHOC extends React.Component {
  /**
   * Only re-render on value change, but always re-render objects and lists.
   * Their child widgets will each also be wrapped with this component, and
   * will only be updated on value change.
   */
  shouldComponentUpdate(nextProps) {
    const isWidgetContainer = ['object', 'list'].includes(nextProps.field.get('widget'));
    return (
      isWidgetContainer ||
      this.props.value !== nextProps.value ||
      this.props.fieldsMetaData !== nextProps.fieldsMetaData
    );
  }

  render() {
    const { previewComponent, ...props } = this.props;
    return React.createElement(previewComponent, props);
  }
}

PreviewHOC.propTypes = {
  previewComponent: PropTypes.func.isRequired,
  field: ImmutablePropTypes.map.isRequired,
  value: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.string, PropTypes.bool]),
};

export default PreviewHOC;
