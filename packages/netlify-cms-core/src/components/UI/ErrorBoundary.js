import React from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-polyglot';
import styled, { css } from 'react-emotion';
import copyToClipboard from 'copy-text-to-clipboard';
import { localForage } from 'netlify-cms-lib-util';
import { buttons, colors } from 'netlify-cms-ui-default';

const ISSUE_URL = 'https://github.com/netlify/netlify-cms/issues/new?template=bug_report.md';

const styles = {
  errorBoundary: css`
    padding: 40px;

    h1 {
      font-size: 28px;
    }

    h2 {
      font-size: 20px;
    }

    strong {
      color: ${colors.textLead};
      font-weight: 500;
    }

    hr {
      width: 200px;
      margin: 30px 0;
      border: 0;
      height: 1px;
      background-color: ${colors.text};
    }
  `,
  errorText: css`
    color: ${colors.errorText};
  `,
};

const CopyButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${buttons.gray};
  display: block;
  margin: 12px 0;
`;

class ErrorBoundary extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
  };

  state = {
    hasError: false,
    errorMessage: '',
    backup: '',
  };

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true, errorMessage: error.toString() };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.state.errorMessage !== nextState.errorMessage || this.state.backup !== nextState.backup
    );
  }

  async componentDidUpdate() {
    const backup = await localForage.getItem('backup');
    console.log(backup);
    this.setState({ backup });
  }

  render() {
    const { hasError, errorMessage, backup } = this.state;
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
        <hr />
        <h2>Details</h2>
        <p>{errorMessage}</p>
        {backup && (
          <>
            <hr />
            <h2>Recovered document</h2>
            <strong>Please copy/paste this somewhere before navigating away!</strong>
            <CopyButton onClick={() => copyToClipboard(backup)}>Copy to clipboard</CopyButton>
            <pre>
              <code>{backup}</code>
            </pre>
          </>
        )}
      </div>
    );
  }
}

export default translate()(ErrorBoundary);
