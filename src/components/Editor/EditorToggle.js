import React from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import { Icon } from 'UI';

const EditorToggle = ({ enabled, active, onClick, icon }) => !enabled ? null :
  <button className={c('nc-editor-toggle', {'nc-editor-toggleActive': active })} onClick={onClick}>
    <Icon type={icon} size="large"/>
  </button>;

EditorToggle.propTypes = {
  enabled: PropTypes.bool,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
};

export default EditorToggle;
