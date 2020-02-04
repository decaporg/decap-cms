import React from 'react';
import styled from '@emotion/styled';
import theme from '../theme';

const StyledCommunityChannelsList = styled.ul`
  margin-left: 0;

  li {
    list-style-type: none;
    margin-bottom: 24px;
  }

  a {
    display: block;
    font-weight: inherit;
    position: relative;

    &:focus,
    &:active,
    &:hover {
      &:before {
        display: block;
      }
    }

    &:before {
      display: none;
      content: '';
      position: absolute;
      width: 3px;
      height: 100%;
      background-color: ${theme.colors.darkGreen};
      left: -16px;
    }
  }

  p {
    color: ${theme.colors.gray};
    margin-bottom: 0;
  }
`;

const CommunityChannelsList = ({ channels }) => (
  <StyledCommunityChannelsList>
    {channels.map(({ title, description, url }, idx) => (
      <li key={idx}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <strong>{title}</strong>
          <p>{description}</p>
        </a>
      </li>
    ))}
  </StyledCommunityChannelsList>
);

export default CommunityChannelsList;
