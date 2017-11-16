import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import { connect } from 'react-redux';
import { Map } from 'immutable';
import { openMediaLibrary, removeInsertedMedia } from '../../../../../actions/mediaLibrary';
import ToolbarPluginFormControl from './ToolbarPluginFormControl';

class ToolbarPluginForm extends React.Component {
  static propTypes = {
    plugin: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    onRemoveInsertedMedia: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      data: Map(),
    };
  }

  handleSubmit = (event) => {
    const { plugin, onSubmit } = this.props;
    onSubmit(plugin, this.state.data);
    event.preventDefault();
  }

  render() {
    const {
      plugin,
      onSubmit,
      onCancel,
      value,
      onAddAsset,
      getAsset,
      onChange,
      onOpenMediaLibrary,
      onRemoveInsertedMedia,
      mediaPaths,
    } = this.props;

    return (
      <form onSubmit={this.handleSubmit}>
        <h3>Insert {plugin.get('label')}</h3>
        <div>
          {plugin.get('fields').map((field, index) => (
            <ToolbarPluginFormControl
              key={index}
              field={field}
              value={this.state.data.get(field.get('name'))}
              onAddAsset={onAddAsset}
              getAsset={getAsset}
              onChange={(val) => {
                this.setState({ data: this.state.data.set(field.get('name'), val) });
              }}
              mediaPaths={mediaPaths}
              onOpenMediaLibrary={onOpenMediaLibrary}
              onRemoveInsertedMedia={onRemoveInsertedMedia}
            />
          ))}
        </div>
        <div>
          <button onClick={this.handleSubmit}>Insert</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </form>
    );
  }
}

const mapStateToProps = state => ({
  mediaPaths: state.mediaLibrary.get('controlMedia'),
});

const mapDispatchToProps = {
  onOpenMediaLibrary: openMediaLibrary,
  onRemoveInsertedMedia: removeInsertedMedia,
};

export default connect(mapStateToProps, mapDispatchToProps)(ToolbarPluginForm);
