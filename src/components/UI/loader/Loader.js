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
      return <div className="nc-loader-text">{children}</div>;
    } else if (Array.isArray(children)) {
      this.setAnimation();
      return (<div className="nc-loader-text">
        <CSSTransition
          classNames={{
            enter: 'nc-loader-enter',
            enterActive: 'nc-loader-enterActive',
            exit: 'nc-loader-exit',
            exitActive: 'nc-loader-exitActive',
          }}
          timeout={500}
        >
          <div key={currentItem} className="nc-loader-animateItem">{children[currentItem]}</div>
        </CSSTransition>
      </div>);
    }
  };

  render() {
    const { active, style, className = '' } = this.props;

    // Class names
    let classNames = 'nc-loader-loader';
    if (active) {
      classNames += ` nc-loader-active`;
    }
    if (className.length > 0) {
      classNames += ` ${ className }`;
    }

    return <div className={classNames} style={style}>{this.renderChild()}</div>;
  }
}
