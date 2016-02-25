import React from 'react';
import { connect } from 'react-redux';
import { loadConfig } from '../actions/config';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.dispatch(loadConfig());
  }

  configError(config) {
    return <div>
      <h1>Error loading the CMS configuration</h1>

      <div>
        <p>The "config.yml" file could not be loaded or failed to parse properly.</p>
        <p><strong>Error message:</strong> {config.get('error')}</p>
      </div>
    </div>;
  }

  configLoading() {
    return <div>
      <h1>Loading configuration...</h1>
    </div>;
  }

  render() {
    const { config, children } = this.props;

    if (config === null) {
      return null;
    }

    if (config.get('error')) {
      return this.configError(config);
    }

    if (config.get('isFetching')) {
      return this.configLoading();
    }

    return (
      <div>{children}</div>
    );
  }
}

function mapStateToProps(state) {
  return {
    config: state.config
  };
}

export default connect(mapStateToProps)(App);
