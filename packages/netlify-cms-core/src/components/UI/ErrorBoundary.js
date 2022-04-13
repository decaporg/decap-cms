import React from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import yaml from 'yaml';
import { truncate } from 'lodash';
import copyToClipboard from 'copy-text-to-clipboard';
import { localForage } from 'netlify-cms-lib-util';
import { buttons, colors } from 'netlify-cms-ui-default';
import cleanStack from 'clean-stack';

const ISSUE_URL = 'https://github.com/netlify/netlify-cms/issues/new?';

function getIssueTemplate({ version, provider, browser, config }) {
  return `
**Describe the bug**

**To Reproduce**

**Expected behavior**

**Screenshots**

**Applicable Versions:**
 - Netlify CMS version: \`${version}\`
 - Git provider: \`${provider}\`
 - Browser version: \`${browser}\`

**CMS configuration**
\`\`\`
${config}
\`\`\`

**Additional context**
`;
}

function buildIssueTemplate({ config }) {
  let version = '';
  if (typeof NETLIFY_CMS_VERSION === 'string') {
    version = `netlify-cms@${NETLIFY_CMS_VERSION}`;
  } else if (typeof NETLIFY_CMS_APP_VERSION === 'string') {
    version = `netlify-cms-app@${NETLIFY_CMS_APP_VERSION}`;
  }
  const template = getIssueTemplate({
    version,
    provider: config.backend.name,
    browser: navigator.userAgent,
    config: yaml.stringify(config),
  });

  return template;
}

function buildIssueUrl({ title, config }) {
  try {
    const body = buildIssueTemplate({ config });

    const params = new URLSearchParams();
    params.append('title', truncate(title, { length: 100 }));
    params.append('body', truncate(body, { length: 4000, omission: '\n...' }));
    params.append('labels', 'type: bug');

    return `${ISSUE_URL}${params.toString()}`;
  } catch (e) {
    console.log(e);
    return `${ISSUE_URL}template=bug_report.md`;
  }
}

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
    color: ${colors.active};
  }
`;

const PrivacyWarning = styled.span`
  color: ${colors.text};
`;

const CopyButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${buttons.gray};
  display: block;
  margin: 12px 0;
`;

function RecoveredEntry({ entry, t }) {
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
}

export class ErrorBoundary extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
    config: PropTypes.object.isRequired,
  };

  state = {
    hasError: false,
    errorMessage: '',
    errorTitle: '',
    backup: '',
  };

  static getDerivedStateFromError(error) {
    console.error(error);
    return {
      hasError: true,
      errorMessage: cleanStack(error.stack, { basePath: window.location.origin || '' }),
      errorTitle: error.toString(),
    };
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
      backup && console.log(backup);
      this.setState({ backup });
    }
  }

  render() {
    const { hasError, errorMessage, backup, errorTitle } = this.state;
    const { showBackup, t } = this.props;
    if (!hasError) {
      return this.props.children;
    }
    return (
      <ErrorBoundaryContainer>
        <h1>{t('ui.errorBoundary.title')}</h1>
        <p>
          <span>{t('ui.errorBoundary.details')}</span>
          <a
            href={buildIssueUrl({ title: errorTitle, config: this.props.config })}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="issue-url"
          >
            {t('ui.errorBoundary.reportIt')}
          </a>
        </p>
        <p>
          {t('ui.errorBoundary.privacyWarning')
            .split('\n')
            .map((item, index) => (
              <>
                <PrivacyWarning key={index}>{item}</PrivacyWarning>
                <br />
              </>
            ))}
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
