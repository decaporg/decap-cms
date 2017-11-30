import PropTypes from 'prop-types';
import React from 'react';

const ErrorComponent = () => {
  const issueUrl = "https://github.com/netlify/netlify-cms/issues/new";
  return (
    <div className="nc-errorBoundary">
      <h1 className="nc-errorBoundary-heading">Sorry!</h1>
      <p>
        <span>There's been an error - please </span>
        <a href={issueUrl} target="_blank" className="nc-errorBoundary-link">report it</a>!
      </p>
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

  componentDidCatch(error) {
    console.error(error);
    this.setState({ hasError: true });
  }

  render() {
    const errorComponent = this.props.errorComponent || <ErrorComponent/>;
    return this.state.hasError ? errorComponent : this.props.children;
  }
}
