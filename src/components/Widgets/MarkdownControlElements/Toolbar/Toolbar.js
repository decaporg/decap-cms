import React, { PropTypes } from 'react';
import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Switch from 'react-toolbox/lib/switch';
import ToolbarButton from './ToolbarButton';
import ToolbarComponentsMenu from './ToolbarComponentsMenu';
import ToolbarPluginForm from './ToolbarPluginForm';
import { Icon } from '../../../UI';
import styles from './Toolbar.css';

export default class Toolbar extends React.Component {
  static propTypes = {
    selectionPosition: PropTypes.object,
    onH1: PropTypes.func.isRequired,
    onH2: PropTypes.func.isRequired,
    onBold: PropTypes.func.isRequired,
    onItalic: PropTypes.func.isRequired,
    onLink: PropTypes.func.isRequired,
    onToggleMode: PropTypes.func.isRequired,
    rawMode: PropTypes.bool,
    plugins: ImmutablePropTypes.listOf(ImmutablePropTypes.record),
    onSubmit: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      activePlugin: null,
    };
  }

  handlePluginFormDisplay = (plugin) => {
    this.setState({ activePlugin: plugin });
  }

  handlePluginFormSubmit = (plugin, pluginData) => {
    this.props.onSubmit(plugin, pluginData);
    this.setState({ activePlugin: null });
  };

  handlePluginFormCancel = (e) => {
    this.setState({ activePlugin: null });
  };

  render() {
    const {
      onH1,
      onH2,
      onBold,
      onItalic,
      onLink,
      onToggleMode,
      rawMode,
      plugins,
      onAddAsset,
      onRemoveAsset,
      getAsset,
    } = this.props;

    const { activePlugin } = this.state;

    return (
      <div className={styles.Toolbar}>
        <ToolbarButton label="Header 1" icon="h1" action={onH1}/>
        <ToolbarButton label="Header 2" icon="h2" action={onH2}/>
        <ToolbarButton label="Bold" icon="bold" action={onBold}/>
        <ToolbarButton label="Italic" icon="italic" action={onItalic}/>
        <ToolbarButton label="Link" icon="link" action={onLink}/>
        <ToolbarComponentsMenu
          plugins={plugins}
          onComponentMenuItemClick={this.handlePluginFormDisplay}
        />
        {activePlugin &&
          <ToolbarPluginForm
            plugin={activePlugin}
            onSubmit={this.handlePluginFormSubmit}
            onCancel={this.handlePluginFormCancel}
            onAddAsset={onAddAsset}
            onRemoveAsset={onRemoveAsset}
            getAsset={getAsset}
          />
        }
        <Switch label="Markdown" onChange={onToggleMode} checked={rawMode} className={styles.Toggle}/>
      </div>
    );
  }
}
