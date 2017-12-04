import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'UI';

const EditorToggle = ({ enabled, onClick, icon }) => !enabled ? null :
  <button onClick={onClick}>
    <Icon type={icon} size="large"/>
  </button>;

EditorToggle.propTypes = {
  enabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
};

export default EditorToggle;
