// eslint-disable-next-line no-unused-vars
import React from 'react';
import PropTypes from 'prop-types';
import { css, Global } from '@emotion/core';
import { translate } from 'react-polyglot';
import reduxNotificationsStyles from 'redux-notifications/lib/styles.css';
import { shadows, colors, lengths, zIndex } from 'netlify-cms-ui-legacy';

const ReduxNotificationsGlobalStyles = () => (
  <Global
    styles={css`
      ${reduxNotificationsStyles};

      .notif__container {
        z-index: ${zIndex.zIndex10000};
        white-space: pre-wrap;
      }
    `}
  />
);

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
  <div css={[styles.toast, styles[kind]]}>
    <ReduxNotificationsGlobalStyles />
    {t(message.key, { details: message.details })}
  </div>
);

Toast.propTypes = {
  kind: PropTypes.oneOf(['info', 'success', 'warning', 'danger']).isRequired,
  message: PropTypes.object,
  t: PropTypes.func.isRequired,
};

export default translate()(Toast);
