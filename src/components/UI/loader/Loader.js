import React from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';
import { prefixer } from '../../../lib/styleHelper';

const styles = prefixer('loader');

export default class Loader extends React.Component {

  state = {
    currentItem: 0,
  };

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  setAnimation = () => {
    if (this.interval) return;
    const { children } = this.props;

    this.interval = setInterval(() => {
      const nextItem = (this.state.currentItem === children.length - 1) ? 0 : this.state.currentItem + 1;
      this.setState({ currentItem: nextItem });
    }, 5000);
  };

  renderChild = () => {
    const { children } = this.props;
    const { currentItem } = this.state;
    if (!children) {
      return null;
    } else if (typeof children == 'string') {
      return <div className={styles("text")}>{children}</div>;
    } else if (Array.isArray(children)) {
      this.setAnimation();
      return (<div className={styles("text")}>
        <CSSTransition
          classNames={{
            enter: styles('enter'),
            enterActive: styles('enterActive'),
            exit: styles('exit'),
            exitActive: styles('exitActive'),
          }}
          timeout={500}
        >
          <div key={currentItem} className={styles("animateItem")}>{children[currentItem]}</div>
        </CSSTransition>
      </div>);
    }
  };

  render() {
    const { active, style, className = '' } = this.props;

    // Class names
    let classNames = styles("loader");
    if (active) {
      classNames += ` ${ styles("active") }`;
    }
    if (className.length > 0) {
      classNames += ` ${ className }`;
    }

    return <div className={classNames} style={style}>{this.renderChild()}</div>;
  }
}
