import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Icon, colors, colorsRaw, shadows, buttons } from 'netlify-cms-ui-default';

const EditorToggleButton = styled.button`
  ${buttons.button};
  ${shadows.dropMiddle};
  background-color: ${colorsRaw.white};
  color: ${props => colors[props.isActive ? `active` : `inactive`]};
  border-radius: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  margin-bottom: 12px;
`;

const EditorToggle = ({ enabled, active, onClick, icon }) =>
  !enabled ? null : (
    <EditorToggleButton onClick={onClick} isActive={active}>
      <Icon type={icon} size="large" />
    </EditorToggleButton>
  );

EditorToggle.propTypes = {
  enabled: PropTypes.bool,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
};

export default EditorToggle;
