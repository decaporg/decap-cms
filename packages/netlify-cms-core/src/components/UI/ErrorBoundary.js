import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { translate } from 'react-polyglot';
import styled from '@emotion/styled';
import yaml from 'js-yaml';
import { truncate } from 'lodash';
import { colors } from 'netlify-cms-ui-default';

const ISSUE_URL = 'https://github.com/netlify/netlify-cms/issues/new?';
const getIssueTemplate = ({ version, provider, browser, config }) => `
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

const buildIssueTemplate = ({ config }) => {
  let version = '';
  if (typeof NETLIFY_CMS_VERSION === 'string') {
    version = `netlify-cms@${NETLIFY_CMS_VERSION}`;
  } else if (typeof NETLIFY_CMS_APP_VERSION === 'string') {
    version = `netlify-cms-app@${NETLIFY_CMS_APP_VERSION}`;
  }
  const template = getIssueTemplate({
    version,
    provider: config.getIn(['backend', 'name']),
    browser: navigator.userAgent,
    config: yaml.safeDump(config.toJS()),
  });

  return template;
};

const buildIssueUrl = ({ title, config }) => {
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
};

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

class ErrorBoundary extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    t: PropTypes.func.isRequired,
    config: ImmutablePropTypes.map.isRequired,
  };

  state = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true, errorMessage: error.toString() };
  }

  render() {
    const { hasError, errorMessage } = this.state;
    const { t } = this.props;
    if (!hasError) {
      return this.props.children;
    }
    return (
      <ErrorBoundaryContainer>
        <h1>{t('ui.errorBoundary.title')}</h1>
        <p>
          <span>{t('ui.errorBoundary.details')}</span>
          <a
            href={buildIssueUrl({ title: errorMessage, config: this.props.config })}
            target="_blank"
            rel="noopener noreferrer"
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
      </ErrorBoundaryContainer>
    );
  }
}

export default translate()(ErrorBoundary);
