import React from 'react';
import styled from '@emotion/styled';

import { mq } from '../utils';
import theme from '../theme';

const ChatLink = styled.a`
  z-index: 100;
  position: fixed;
  bottom: 10px;
  right: 10px;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.darkerGray};
  color: ${theme.colors.darkerGray};
  background-color: ${theme.colors.white};
  font-size: 14px;
  text-align: right;
  display: none;

  ${mq[1]} {
    display: block;
  }
`;

function ChatButton() {
  return (
    <ChatLink href="/chat" target="_blank" rel="noopener noreferrer">
      <p>Join us on</p>
      <img src="/img/discord.svg" width="96px" alt="Discord" />
    </ChatLink>
  );
}

export default ChatButton;
