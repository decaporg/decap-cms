import React, { PropTypes } from 'react';
import styles from './ScaledLine.css';

export default class ScaledLine extends React.Component {
  constructor(props) {
    super(props);
    this._content = null;
    this.state = {
      contentWidth: 0,
      ratio: 1,
    };
  }

  componentDidMount() {
    const actualContent = this._content.children[0];

    this.setState({
      contentWidth: actualContent.offsetWidth,
      ratio: this.props.toWidth / actualContent.offsetWidth,
    });
  }

  render() {
    const { ratio } = this.state;
    const { children } = this.props;

    var baseFontSize = 15;

    var inlineStyles = {
    };
    inlineStyles.fontSize = Math.round((baseFontSize * ratio)*1000)/1000

    return (
      <div ref={(c) => this._content = c} style={inlineStyles} className={styles.root}>
        <span>{children}</span>
      </div>
    )
  }
};

ScaledLine.propTypes = {
  toWidth: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired
};
