import React from 'react';
import styled from '@emotion/styled';
import { zIndex } from 'netlify-cms-ui-default';

const ChatLink = styled.a`
  z-index: ${zIndex.zIndex100};
  position: fixed;
  bottom: 10px;
  right: 10px;
  cursor: pointer;
`;

const ChatButton = () => (
  <ChatLink href="/chat" target="_blank" rel="noopener noreferrer">
    <img src="/img/slack.svg" />
  </ChatLink>
);

export default ChatButton;
