import React from 'react';
import PropTypes from 'prop-types';
import { css, injectGlobal, cx } from 'react-emotion';
import { translate } from 'react-polyglot';
import reduxNotificationsStyles from 'redux-notifications/lib/styles.css';
import { shadows, colors, lengths } from 'netlify-cms-ui-default';

injectGlobal`
  ${reduxNotificationsStyles};

  .notif__container {
    z-index: 10000;
    white-space: pre-wrap;
  }
`;

const styles = {
  toast: css`
    ${shadows.drop};
    background-color: ${colors.background};
    color: ${colors.textLight};
    border-radius: ${lengths.borderRadius};
    margin: 10px;
    padding: 20px;
    overflow: hidden;
  `,
  info: css`
    background-color: ${colors.infoBackground};
    color: ${colors.infoText};
  `,
  success: css`
    background-color: ${colors.successBackground};
    color: ${colors.successText};
  `,
  warning: css`
    background-color: ${colors.warnBackground};
    color: ${colors.warnText};
  `,
  danger: css`
    background-color: ${colors.errorBackground};
    color: ${colors.errorText};
  `,
};

const Toast = ({ kind, message, t }) => (
  <div className={cx(styles.toast, styles[kind])}>
    {t(message.key, { details: message.details })}
  </div>
);

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.object,
  t: PropTypes.func.isRequired,
};

export default translate()(Toast);
