import React from 'react';
import styled from '@emotion/styled';

const AwardLink = styled.a`
  display: block;
  text-align: center;

  img {
    width: 60vw;
    max-width: 280px;
  }
`;

function Awards({ items }) {
  return items.map(item =>
    <AwardLink href={item.href} title={item.title}>
      <img src={item.image} alt={item.title} />
    </AwardLink>
  );
}

export default Awards;
