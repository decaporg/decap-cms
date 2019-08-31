import styled from '@emotion/styled';
import React from 'react';

import { colorsRaw } from './styles.js';
import Icon from './Icon';

const GoBackButtonStyle = styled.a`
  display: flex;
  margin-top: 40px;
  padding: 10px;
`;

const ButtonText = styled.p`
  color: ${colorsRaw.gray};
  margin: 0 10px;
`;

export default class GoBackButton extends React.Component {
  render() {
    return (
      <GoBackButtonStyle href={this.props.href}>
        <Icon type="arrow" />
        <ButtonText>Go back to site</ButtonText>
      </GoBackButtonStyle>
    );
  }
}
