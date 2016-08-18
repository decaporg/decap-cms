import React, { Component, PropTypes } from 'react';
import Portal from 'react-portal';
import { Icon } from '../../../UI';
import MediaProxy from '../../../../valueObjects/MediaProxy';
import styles from './BlockTypesMenu.css';

export default class BlockTypesMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      menu: null
    };

    this.updateMenuPosition = this.updateMenuPosition.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleBlockTypeClick = this.handleBlockTypeClick.bind(this);
    this.handlePluginClick = this.handlePluginClick.bind(this);
    this.handleFileUploadClick = this.handleFileUploadClick.bind(this);
    this.handleFileUploadChange = this.handleFileUploadChange.bind(this);
    this.renderBlockTypeButton = this.renderBlockTypeButton.bind(this);
    this.renderPluginButton = this.renderPluginButton.bind(this);
  }

  /**
   * On update, update the menu.
   */
  componentDidMount() {
    this.updateMenuPosition();
  }

  componentWillUpdate() {
    if (this.state.expanded) {
      this.setState({ expanded: false });
    }
  }

  componentDidUpdate() {
    this.updateMenuPosition();
  }

  updateMenuPosition() {
    const { menu } = this.state;
    const { position } = this.props;
    if (!menu) return;

    menu.style.opacity = 1;
    menu.style.top = `${position.top}px`;
    menu.style.left = `${position.left - menu.offsetWidth * 2}px`;

  }

  toggleMenu() {
    this.setState({ expanded: !this.state.expanded });
  }

  handleBlockTypeClick(e, type) {
    this.props.onClickBlock(type);
  }

  handlePluginClick(e, plugin) {
    const data = {};
    plugin.fields.forEach(field => {
      data[field.name] = window.prompt(field.label);
    });
    this.props.onClickPlugin(plugin.id, data);
  }

  handleFileUploadClick() {
    this._fileInput.click();
  }

  handleFileUploadChange(e) {
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

  }

  renderBlockTypeButton(type, icon) {
    const onClick = e => this.handleBlockTypeClick(e, type);
    return (
      <Icon key={type} type={icon} onClick={onClick} className={styles.icon} />
    );
  }

  renderPluginButton(plugin) {
    const onClick = e => this.handlePluginClick(e, plugin);
    return (
      <Icon key={plugin.id} type={plugin.icon} onClick={onClick} className={styles.icon} />
    );
  }

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
              ref={(el) => this._fileInput = el}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * When the portal opens, cache the menu element.
   */
  handleOpen(portal) {
    this.setState({ menu: portal.firstChild });
  }

  render() {
    const { isOpen } = this.props;
    return (
      <Portal isOpened={isOpen} onOpen={this.handleOpen}>
        <div className={styles.root}>
          <Icon type="plus-squared" className={styles.button} onClick={this.toggleMenu} />
          {this.renderMenu()}
        </div>
      </Portal>
    );
  }
}

BlockTypesMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  plugins: PropTypes.array.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired
  }),
  onClickBlock: PropTypes.func.isRequired,
  onClickPlugin: PropTypes.func.isRequired,
  onClickImage: PropTypes.func.isRequired
};
