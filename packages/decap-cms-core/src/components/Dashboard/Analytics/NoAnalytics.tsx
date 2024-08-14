import React from 'react';
import { translate } from 'react-polyglot';
import PropTypes from 'prop-types';

type NoAnalyticsProps = {
  t: (key: string) => string;
};

function NoAnalytics({ t }: NoAnalyticsProps) {
  function handleHideMessage() {
    // dispatch(hideNoAnalyticsMessage());
  }

  return (
    <div>
      <p>{t('dashboard.siteAnalytics.noAnalytics')}</p>
    </div>
  );
}

NoAnalytics.propTypes = {
  t: PropTypes.func.isRequired,
};

export default translate()(NoAnalytics);
