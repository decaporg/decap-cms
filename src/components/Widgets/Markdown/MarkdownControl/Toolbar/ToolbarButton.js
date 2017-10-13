import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import { Icon } from '../../../../UI';

const ToolbarButton = ({ label, icon, action, active, disabled }) => (
  <button
    className={classnames('nc-toolbarButton-button', { ['nc-toolbarButton-active']: active })}
    onClick={action}
    title={label}
    disabled={disabled}
  >
    { icon ? <Icon type={icon} /> : label }
  </button>
);

ToolbarButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  action: PropTypes.func.isRequired,
  active: PropTypes.bool,
};

export default ToolbarButton;
