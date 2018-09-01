import React from 'react';
import styled from 'react-emotion';
import { translate } from 'react-polyglot';
import { lengths } from 'netlify-cms-ui-default';

const NotFoundContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

const NotFoundPage = ({ t }) => (
  <NotFoundContainer>
    <h2>{t('app.notFoundPage.header')}</h2>
  </NotFoundContainer>
);

export default translate()(NotFoundPage);
