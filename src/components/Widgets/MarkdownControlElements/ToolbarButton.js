import React, { PropTypes } from 'react';
import classnames from 'classnames';
import { Icon } from '../../UI';
import styles from './Toolbar.css';

const ToolbarButton = ({ label, icon, action, active }) => (
  <li className={classnames(styles.Button, { [styles.ButtonActive]: active })}>
    <button className={styles[label]} onClick={action} title={label}>
      { icon ? <Icon type={icon} /> : label }
    </button>
  </li>
);

ToolbarButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  action: PropTypes.func.isRequired,
  active: PropTypes.bool,
};

export default ToolbarButton;
