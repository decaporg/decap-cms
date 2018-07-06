import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import Icon from 'netlify-cms-ui-default/Icon';
import { colors, colorsRaw, shadows } from 'netlify-cms-ui-default/styles';

const EditorToggleButton = styled.button`
  ${shadows.dropMiddle};
  background-color: ${colorsRaw.white};
  color: ${props => colors[props.active ? `active` : `inactive`]};
  border-radius: 32px;
  display: block;
  width: 40px;
  height: 40px;
  padding: 0;
  margin-bottom: 12px;

  ${Icon} {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`

const EditorToggle = ({ enabled, active, onClick, icon }) => !enabled ? null :
  <EditorToggleButton onClick={onClick}>
    <Icon type={icon} size="large"/>
  </EditorToggleButton>;

EditorToggle.propTypes = {
  enabled: PropTypes.bool,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
};

export default EditorToggle;
