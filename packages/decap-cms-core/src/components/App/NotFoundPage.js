import React from 'react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { lengths } from 'decap-cms-ui-default';
import PropTypes from 'prop-types';

const NotFoundContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

function NotFoundPage({ t }) {
  return (
    <NotFoundContainer>
      <h2>{t('app.notFoundPage.header')}</h2>
    </NotFoundContainer>
  );
}

NotFoundPage.propTypes = {
  t: PropTypes.func.isRequired,
};

export default translate()(NotFoundPage);
