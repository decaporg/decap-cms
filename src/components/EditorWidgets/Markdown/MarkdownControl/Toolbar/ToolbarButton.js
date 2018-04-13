import PropTypes from 'prop-types';
import React from 'react';
import c from 'classnames';
import { Icon } from 'UI';

const ToolbarButton = ({ type, label, icon, onClick, isActive, isHidden, disabled }) => {
  const active = isActive && type && isActive(type);

  if (isHidden) {
    return null;
  }

  return (
    <button
      className={c('nc-toolbarButton-button', { ['nc-toolbarButton-active']: active })}
      onClick={e => onClick && onClick(e, type)}
      title={label}
      disabled={disabled}
    >
      { icon ? <Icon type={icon}/> : label }
    </button>
  );
};

ToolbarButton.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  isActive: PropTypes.func,
  disabled: PropTypes.bool,
};

export default ToolbarButton;
