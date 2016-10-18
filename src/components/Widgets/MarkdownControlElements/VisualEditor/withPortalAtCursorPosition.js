import React from 'react';
import Portal from 'react-portal';
import position from 'selection-position';

export default function withPortalAtCursorPosition(WrappedComponent) {
  return class extends React.Component {

    static propTypes = {
      isOpen: React.PropTypes.bool.isRequired,
    };

    state = {
      menu: null,
      cursorPosition: null,
    };

    componentDidMount() {
      this.adjustPosition();
    }

    componentDidUpdate() {
      this.adjustPosition();
    }

    adjustPosition = () => {
      const { menu } = this.state;

      if (!menu) return;

      const cursorPosition = position(); // TODO: Results aren't determenistic
      const centerX = Math.ceil(
        cursorPosition.left
        + cursorPosition.width / 2
        + window.scrollX
        - menu.offsetWidth / 2
      );
      const centerY = cursorPosition.top + window.scrollY;
      menu.style.opacity = 1;
      menu.style.top = `${ centerY }px`;
      menu.style.left = `${ centerX }px`;
    };

    /**
     * When the portal opens, cache the menu element.
     */
    handleOpen = (portal) => {
      this.setState({ menu: portal.firstChild });
    };

    render() {
      const { isOpen, ...rest } = this.props;
      return (
        <Portal isOpened={isOpen} onOpen={this.handleOpen}>
          <WrappedComponent {...rest} />
        </Portal>
      );
    }
  };
}
