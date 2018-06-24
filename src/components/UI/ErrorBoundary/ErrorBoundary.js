import PropTypes from 'prop-types';
import React from 'react';

const DefaultErrorComponent = () => {
};

const ISSUE_URL = "https://github.com/netlify/netlify-cms/issues/new";

export class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
    errorMessage: '',
  };

  componentDidCatch(error) {
    console.error(error);
    this.setState({ hasError: true, errorMessage: error.toString() });
  }

  render() {
    const { hasError, errorMessage } = this.state;
    if (!hasError) {
      return this.props.children;
    }
    return (
      <div className="nc-errorBoundary">
        <h1 className="nc-errorBoundary-heading">Sorry!</h1>
        <p>
          <span>There's been an error - please </span>
          <a href={ISSUE_URL} target="_blank" className="nc-errorBoundary-link">report it</a>!
        </p>
        <p>{errorMessage}</p>
      </div>
    );
  }
}
