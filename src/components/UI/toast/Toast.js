import React, { PropTypes } from 'react';
import { Icon } from '../index';
import styles from './Toast.css';

export default class Toast extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shown: false
    };

    this.autoHideTimeout = this.autoHideTimeout.bind(this);
  }

  componentWillMount() {
    if (this.props.show) {
      this.autoHideTimeout();
      this.setState({ shown: true });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      if (nextProps.show) this.autoHideTimeout();
      this.setState({ shown: nextProps.show });
    }
  }

  componentWillUnmount() {
    if (this.timeOut) {
      clearTimeout(this.timeOut);
    }
  }

  autoHideTimeout() {
    clearTimeout(this.timeOut);
    this.timeOut = setTimeout(() => {
      this.setState({ shown: false });
    }, 4000);
  }

  render() {
    const { style, type, className, children } = this.props;
    const icons = {
      success: 'check',
      warning: 'attention',
      error: 'alert'
    };
    const classes = [styles.toast];
    if (className) classes.push(className);

    let icon = '';
    if (type) {
      classes.push(styles[type]);
      icon = <Icon type={icons[type]} className={styles.icon} />;
    }

    if (!this.state.shown) {
      classes.push(styles.hidden);
    }

    return (
      <div className={classes.join(' ')} style={style}>{icon}{children}</div>
    );
  }
}

Toast.propTypes = {
  style: PropTypes.object,
  type: PropTypes.oneOf(['success', 'warning', 'error']).isRequired,
  className: PropTypes.string,
  show: PropTypes.bool,
  children: PropTypes.node
};
