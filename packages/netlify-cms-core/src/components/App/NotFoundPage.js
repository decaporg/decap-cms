import React from 'react';
import styled from 'react-emotion';
import { lengths } from 'netlify-cms-ui-default/styles';


const NotFoundContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

export default () => (
  <NotFoundContainer>
    <h2>Not Found</h2>
  </NotFoundContainer>
);
