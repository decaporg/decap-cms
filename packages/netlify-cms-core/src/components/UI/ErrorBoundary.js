import React from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import copyToClipboard from 'copy-text-to-clipboard';
import { localForage } from 'netlify-cms-lib-util';
import { buttons, colors } from 'netlify-cms-ui-default';

const ISSUE_URL = 'https://github.com/netlify/netlify-cms/issues/new?template=bug_report.md';

const ErrorBoundaryContainer = styled.div`
  padding: 40px;

  h1 {
    font-size: 28px;
    color: ${colors.text};
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

  a {
    color: ${colors.text};
  }
`;

const CopyButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${buttons.gray};
  display: block;
  margin: 12px 0;
`;

const RecoveredEntry = ({ entry, t }) => {
  console.log(entry);
  return (
    <>
      <hr />
      <h2>{t('ui.errorBoundary.recoveredEntry.heading')}</h2>
      <strong>{t('ui.errorBoundary.recoveredEntry.warning')}</strong>
      <CopyButton onClick={() => copyToClipboard(entry)}>
        {t('ui.errorBoundary.recoveredEntry.copyButtonLabel')}
      </CopyButton>
      <pre>
        <code>{entry}</code>
      </pre>
    </>
  );
};

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
    if (this.props.showBackup) {
      return (
        this.state.errorMessage !== nextState.errorMessage || this.state.backup !== nextState.backup
      );
    }
    return true;
  }

  async componentDidUpdate() {
    if (this.props.showBackup) {
      const backup = await localForage.getItem('backup');
      console.log(backup);
      this.setState({ backup });
    }
  }

  render() {
    const { hasError, errorMessage, backup } = this.state;
    const { showBackup, t } = this.props;
    if (!hasError) {
      return this.props.children;
    }
    return (
      <ErrorBoundaryContainer>
        <h1>{t('ui.errorBoundary.title')}</h1>
        <p>
          <span>{t('ui.errorBoundary.details')}</span>
          <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer">
            {t('ui.errorBoundary.reportIt')}
          </a>
        </p>
        <hr />
        <h2>{t('ui.errorBoundary.detailsHeading')}</h2>
        <p>{errorMessage}</p>
        {backup && showBackup && <RecoveredEntry entry={backup} t={t} />}
      </ErrorBoundaryContainer>
    );
  }
}

export default translate()(ErrorBoundary);
