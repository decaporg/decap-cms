import React from 'react';
import styled from 'react-emotion';
import { translate } from 'react-polyglot';
import { lengths } from 'netlify-cms-ui-default';
import PropTypes from 'prop-types';

const NotFoundContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

const NotFoundPage = ({ t }) => (
  <NotFoundContainer>
    <h2>{t('app.notFoundPage.header')}</h2>
  </NotFoundContainer>
);

NotFoundPage.propTypes = {
  t: PropTypes.func.isRequired,
};

export default translate()(NotFoundPage);
