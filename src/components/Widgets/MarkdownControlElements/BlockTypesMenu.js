import React, { Component, PropTypes } from 'react';
import Portal from 'react-portal';
import { Icon } from '../../UI';
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
    this.renderBlockTypeButton = this.renderBlockTypeButton.bind(this);
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
    this.props.onClickBlock(type, false, false);
  }

  renderBlockTypeButton(type, icon) {
    const onClick = e => this.handleBlockTypeClick(e, type);
    return (
      <Icon type={icon} onClick={onClick} className={styles.icon} />
    );
  }

  renderMenu() {
    if (this.state.expanded) {
      return (
        <div className={styles.menu}>
          {this.renderBlockTypeButton('horizontal-rule', 'dot-3')}
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
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired
  }),
  onClickBlock: PropTypes.func.isRequired
};
