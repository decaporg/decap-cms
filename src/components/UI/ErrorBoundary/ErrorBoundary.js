import PropTypes from 'prop-types';
import React from 'react';
import StackTraceGPS from 'stacktrace-gps';
import ErrorStackParser from 'error-stack-parser';

const gps = new StackTraceGPS();

const ErrorComponent = ({ error, stackTrace }) => {
  const issueUrl = "https://github.com/netlify/netlify-cms/issues/new";
  return (
    <div className="nc-errorBoundary">
      <h1 className="nc-errorBoundary-heading">Sorry!</h1>
      <p>
        <span>There's been an error - please </span>
        <a href={issueUrl} target="_blank" className="nc-errorBoundary-link">report it</a>!
      </p>
      <pre>{error.message}</pre>
      <details>
        <summary>Error Details</summary>
        {
          stackTrace
            ? <pre>{stackTrace}</pre>
            : <p>Creating stacktrace...</p>
        }
      </details>
      <p>Netlify CMS version {NETLIFY_CMS_VERSION}.</p>
    </div>
  );
};

export class ErrorBoundary extends React.Component {
  static propTypes = {
    render: PropTypes.element,
  };

  state = {
    hasError: false,
  };

  componentDidCatch(error, info) {
    console.error(error);

    this.setState({ hasError: true, error });

    const stack = ErrorStackParser.parse(error);
    Promise.all(stack.map(frame => gps.getMappedLocation(frame)))
      .then(frames => frames.map(sf => sf.toString()).join('\n'))
      .then(stackTrace => this.setState({ stackTrace }))
      .catch(console.warn);
  }

  render() {
    const errorComponent = this.props.errorComponent || ErrorComponent;
    return this.state.hasError ? <ErrorComponent error={this.state.error} location={this.state.errorLoc} parsedErr={this.state.parsedErr}/> : this.props.children;
  }
}
