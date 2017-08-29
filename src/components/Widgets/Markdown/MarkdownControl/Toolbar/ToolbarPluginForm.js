import React, { PropTypes } from 'react';
import { Map } from 'immutable';
import { Button } from 'react-toolbox/lib/button';
import ToolbarPluginFormControl from './ToolbarPluginFormControl';
import styles from './ToolbarPluginForm.css';

export default class ToolbarPluginForm extends React.Component {
  static propTypes = {
    plugin: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
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
