import React from 'react';
import styled from '@emotion/styled';

const ChatLink = styled.a`
  z-index: 100;
  position: fixed;
  bottom: 10px;
  right: 10px;
  cursor: pointer;
`;

function ChatButton() {
  return (
    <ChatLink href="/chat" target="_blank" rel="noopener noreferrer">
      <img src="/img/slack.svg" />
    </ChatLink>
  );
}

export default ChatButton;
