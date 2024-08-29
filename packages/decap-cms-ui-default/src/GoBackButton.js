import styled from '@emotion/styled';
import React from 'react';
import PropTypes from 'prop-types';

import { colorsRaw } from './styles.js';
import Icon from './Icon';

const GoBackButtonStyle = styled.a`
  display: flex;
  align-items: center;

  margin-top: 50px;
  padding: 10px;

  font-size: 14px;
`;

const ButtonText = styled.p`
  color: ${colorsRaw.gray};
  margin: 0 10px;
`;

export default class GoBackButton extends React.Component {
  static propTypes = {
    href: PropTypes.string.isRequired,
    t: PropTypes.func.isRequired,
  };

  render() {
    const { href, t } = this.props;

    return (
      <GoBackButtonStyle href={href}>
        <Icon type="arrow" size="small" />
        <ButtonText>{t('ui.default.goBackToSite')}</ButtonText>
      </GoBackButtonStyle>
    );
  }
}
