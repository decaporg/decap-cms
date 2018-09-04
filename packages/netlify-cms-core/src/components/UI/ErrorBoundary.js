import React from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-polyglot';
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

class ErrorBoundary extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
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
    const t = this.props.t;
    return (
      <div className={styles.errorBoundary}>
        <h1 className={styles.errorBoundaryText}>{t('ui.errorBoundary.title')}</h1>
        <p>
          <span>{t('ui.errorBoundary.details')}</span>
          <a
            href={ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.errorBoundaryText}
          >
            {t('ui.errorBoundary.reportIt')}
          </a>
        </p>
        <p>{errorMessage}</p>
      </div>
    );
  }
}

export default translate()(ErrorBoundary);
