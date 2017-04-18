import React, { Component, PropTypes } from 'react';
import { fromJS } from 'immutable';
import { Button } from 'react-toolbox/lib/button';
import { Icon } from '../../UI';
import ToolbarButton from './ToolbarButton';
import ToolbarPluginFormControl from './ToolbarPluginFormControl';
import toolbarStyles from './Toolbar.css';
import styles from './ToolbarPlugins.css';

export default class ToolbarPlugins extends Component {
  static propTypes = {
    plugins: PropTypes.object.isRequired,
    onPlugin: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      openPlugin: null,
      pluginData: fromJS({}),
    };
  }

  handlePlugin(plugin) {
    return (e) => {
      e.preventDefault();
      this.setState({ openPlugin: plugin, pluginData: fromJS({}) });
    };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { openPlugin, pluginData } = this.state;
    this.props.onPlugin(openPlugin, pluginData);
    this.setState({ openPlugin: null });
  };

  handleCancel = (e) => {
    e.preventDefault();
    this.setState({ openPlugin: null });
  };

  pluginForm(plugin) {
    return (<form className={styles.pluginForm} onSubmit={this.handleSubmit}>
      <h3 className={styles.header}>Insert {plugin.get('label')}</h3>
      <div className={styles.body}>
        {plugin.get('fields').map((field, index) => (
          <ToolbarPluginFormControl
            key={index}
            field={field}
            value={this.state.pluginData.get(field.get('name'))}
            onAddAsset={this.props.onAddAsset}
            onRemoveAsset={this.props.onRemoveAsset}
            getAsset={this.props.getAsset}
            onChange={(val) => {
              this.setState({ pluginData: this.state.pluginData.set(field.get('name'), val) });
            }}
          />
        ))}
      </div>
      <div className={styles.footer}>
        <Button
          raised
          onClick={this.handleSubmit}
        >
          Insert
        </Button>
        {' '}
        <Button onClick={this.handleCancel}>
          Cancel
        </Button>
      </div>
    </form>);
  }

  render() {
    const { plugins } = this.props;
    const { openPlugin } = this.state;
    const classNames = [styles.root];

    if (openPlugin) {
      classNames.push(styles.openPlugin);
    }

    return (<div className={classNames.join(' ')}>
      {plugins.map(plugin => (
        <ToolbarButton
          key={`plugin-${plugin.get('id')}`}
          label={plugin.get('label')}
          icon={plugin.get('icon')}
          action={this.handlePlugin(plugin)}
        />
      ))}
      {openPlugin && this.pluginForm(openPlugin)}
    </div>);
  }
}
