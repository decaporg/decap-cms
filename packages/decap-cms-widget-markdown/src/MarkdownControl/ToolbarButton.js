import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Toggle } from 'decap-cms-ui-next';

function ToolbarButton({ children, type, label, icon, hasMenu, onClick, isActive, disabled }) {
  return (
    <Tooltip
      label={label}
      enterDelay={1000}
      anchorOrigin={{ y: 'top', x: 'center' }}
      transformOrigin={{ y: 'bottom', x: 'center' }}
    >
      <div>
        <Toggle
          pressed={isActive}
          disabled={disabled}
          onPressedChange={event => onClick && onClick(event, type)}
          icon={icon}
          hasMenu={hasMenu}
        >
          {children}
        </Toggle>
      </div>
    </Tooltip>
  );
}

ToolbarButton.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ToolbarButton;
