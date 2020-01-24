import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import theme from '../theme';

const Notif = styled.a`
  background-color: ${theme.colors.darkerGray};
  color: white;
  display: block;
  padding: ${theme.space[2]} ${theme.space[3]};
  text-align: center;

  /* prettier-ignore */
  ${p =>
    p.loud &&
    css`
      background-color: ${theme.colors.green};
      color: ${theme.colors.darkerGray};
    `}

  em {
    font-style: normal;
    color: #8b8b8b;
    padding: 0 8px;
  }

  sup,
  sub {
    font-size: initial;
    vertical-align: initial;
  }

  .text-link {
    text-decoration: underline;
    color: ${theme.colors.green};
  }
`;

const Notification = ({ url, loud, children }) => (
  <Notif href={url} loud={loud}>
    {children}
  </Notif>
);

export default Notification;
