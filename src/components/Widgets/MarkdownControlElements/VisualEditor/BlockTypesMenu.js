import React, { Component, PropTypes } from 'react';
import withPortalAtCursorPosition from './withPortalAtCursorPosition';
import { Icon } from '../../../UI';
import MediaProxy from '../../../../valueObjects/MediaProxy';
import styles from './BlockTypesMenu.css';

class BlockTypesMenu extends Component {

  static propTypes = {
    plugins: PropTypes.array.isRequired,
    onClickBlock: PropTypes.func.isRequired,
    onClickPlugin: PropTypes.func.isRequired,
    onClickImage: PropTypes.func.isRequired,
  };

  state = {
    expanded: false,
  };

  componentWillUpdate() {
    if (this.state.expanded) {
      this.setState({ expanded: false });
    }
  }

  toggleMenu = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  handleBlockTypeClick = (e, type) => {
    this.props.onClickBlock(type);
  };

  handlePluginClick = (e, plugin) => {
    const data = {};
    plugin.fields.forEach((field) => {
      data[field.name] = window.prompt(field.label); // eslint-disable-line
    });
    this.props.onClickPlugin(plugin.id, data);
  };

  handleFileUploadClick = () => {
    this._fileInput.click();
  };

  handleFileUploadChange = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    const files = [...fileList];
    const imageType = /^image\//;

    // Iterate through the list of files and return the first image on the list
    const file = files.find((currentFile) => {
      if (imageType.test(currentFile.type)) {
        return currentFile;
      }
    });

    if (file) {
      const mediaProxy = new MediaProxy(file.name, file);
      this.props.onClickImage(mediaProxy);
    }
  };

  renderBlockTypeButton = (type, icon) => {
    const onClick = e => this.handleBlockTypeClick(e, type);
    return (
      <Icon key={type} type={icon} onClick={onClick} className={styles.icon} />
    );
  };

  renderPluginButton = (plugin) => {
    const onClick = e => this.handlePluginClick(e, plugin);
    return (
      <Icon key={plugin.id} type={plugin.icon} onClick={onClick} className={styles.icon} />
    );
  };

  renderMenu() {
    const { plugins } = this.props;
    if (this.state.expanded) {
      return (
        <div className={styles.menu}>
          {this.renderBlockTypeButton('hr', 'dot-3')}
          {plugins.map(plugin => this.renderPluginButton(plugin))}
          <Icon type="picture" onClick={this.handleFileUploadClick} className={styles.icon} />
          <input
            type="file"
            accept="image/*"
            onChange={this.handleFileUploadChange}
            className={styles.input}
            ref={(el) => {
              this._fileInput = el;
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className={styles.root}>
        <Icon type="plus-squared" className={styles.button} onClick={this.toggleMenu} />
        {this.renderMenu()}
      </div>
    );
  }
}

export default withPortalAtCursorPosition(BlockTypesMenu);
