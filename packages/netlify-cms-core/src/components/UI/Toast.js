import React from 'react';
import PropTypes from 'prop-types';
import { css, injectGlobal, cx } from 'react-emotion';
import reduxNotificationsStyles from 'redux-notifications/lib/styles.css';
import { shadows, colors, lengths } from 'netlify-cms-ui-default';

injectGlobal`
  ${reduxNotificationsStyles};

  .notif__container {
    z-index: 10000;
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

export const Toast = ({ kind, message }) => (
  <div className={cx(styles.toast, styles[kind])}>{message}</div>
);

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.string,
};
