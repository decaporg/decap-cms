// LazyLoadModule.jsx
import * as React from 'react';
export default class LazyLoadModule extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      module: null,
    };
  }

  // after the initial render, wait for module to load
  async componentDidMount() {
    const { resolve } = this.props;
    const { default: module } = await resolve();
    this.setState({ module });
  }

  render() {
    const { module } = this.state;

    if (!module) return <div>Loading module...</div>;
    if (module.view) return React.createElement(module.view);
  }
}
