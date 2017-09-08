import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from "react-immutable-proptypes";
import { connect } from 'react-redux';
import { Map } from 'immutable';
import { Button } from 'react-toolbox/lib/button';
import { openMediaLibrary } from '../../../../../actions/mediaLibrary';
import ToolbarPluginFormControl from './ToolbarPluginFormControl';
import styles from './ToolbarPluginForm.css';

class ToolbarPluginForm extends React.Component {
  static propTypes = {
    plugin: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    onOpenMediaLibrary: PropTypes.func.isRequired,
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
      onRemoveAsset,
      getAsset,
      onChange,
      onOpenMediaLibrary,
      mediaPaths,
    } = this.props;

    return (
      <form className={styles.pluginForm} onSubmit={this.handleSubmit}>
        <h3 className={styles.header}>Insert {plugin.get('label')}</h3>
        <div className={styles.body}>
          {plugin.get('fields').map((field, index) => (
            <ToolbarPluginFormControl
              key={index}
              field={field}
              value={this.state.data.get(field.get('name'))}
              onAddAsset={onAddAsset}
              onRemoveAsset={onRemoveAsset}
              getAsset={getAsset}
              onChange={(val) => {
                this.setState({ data: this.state.data.set(field.get('name'), val) });
              }}
              mediaPaths={mediaPaths}
              onOpenMediaLibrary={onOpenMediaLibrary}
            />
          ))}
        </div>
        <div className={styles.footer}>
          <Button raised onClick={this.handleSubmit}>Insert</Button>
          {' '}
          <Button onClick={onCancel}>Cancel</Button>
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
};

export default connect(mapStateToProps, mapDispatchToProps)(ToolbarPluginForm);
