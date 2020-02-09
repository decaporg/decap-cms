import React from 'react';
import PropTypes from 'prop-types';

class Asset extends React.Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    getAsset: PropTypes.func.isRequired,
    component: PropTypes.elementType.isRequired,
  };

  subscribed = true;

  state = {
    value: null,
  };

  _fetchAsset() {
    const { getAsset, path } = this.props;
    getAsset(path).then(value => {
      if (this.subscribed) {
        this.setState({ value });
      }
    });
  }

  componentDidMount() {
    this._fetchAsset();
  }

  componentWillUnmount() {
    this.subscribed = false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.path !== this.props.path || prevProps.getAsset !== this.props.getAsset) {
      this._fetchAsset();
    }
  }

  render() {
    const { component, ...props } = this.props;
    return React.createElement(component, { ...props, value: this.state.value });
  }
}

export default Asset;
