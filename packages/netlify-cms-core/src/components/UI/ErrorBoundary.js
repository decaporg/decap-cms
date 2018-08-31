import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'react-emotion';
import { colors } from 'netlify-cms-ui-default';

const ISSUE_URL = 'https://github.com/netlify/netlify-cms/issues/new?template=bug_report.md';

const styles = {
  errorBoundary: css`
    padding: 0 20px;
  `,
  errorText: css`
    color: ${colors.errorText};
  `,
};

export class ErrorBoundary extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

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
      <div className={styles.errorBoundary}>
        <h1 className={styles.errorBoundaryText}>Sorry!</h1>
        <p>
          <span>{"There's been an error - please "}</span>
          <a
            href={ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.errorBoundaryText}
          >
            report it
          </a>
          !
        </p>
        <p>{errorMessage}</p>
      </div>
    );
  }
}
