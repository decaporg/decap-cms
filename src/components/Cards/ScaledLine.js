import React, { PropTypes } from 'react';

export default class ScaledLine extends React.Component {
  constructor(props) {
    super(props);
    this._content = null;
    this.state = {
      ratio: 1,
    };
  }

  componentDidMount() {
    const actualContent = this._content.children[0];

    this.setState({
      ratio: this.props.toWidth / actualContent.offsetWidth,
    });
  }

  render() {
    const { ratio } = this.state;
    const { children } = this.props;

    const styles = {
      fontSize: ratio.toFixed(3) + 'em'
    };

    return (
      <div ref={(c) => this._content = c} style={styles}>
        <span>{children}</span>
      </div>
    );
  }
}

ScaledLine.propTypes = {
  children: PropTypes.node.isRequired,
  toWidth: PropTypes.number.isRequired
};
