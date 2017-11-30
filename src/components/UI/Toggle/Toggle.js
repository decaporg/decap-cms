import React from 'react'
import ReactToggled from 'react-toggled';
import c from 'classnames';

export const Toggle = ({ active, onChange, className }) =>
  <ReactToggled on={active} onToggle={onChange}>
    {({on, getElementTogglerProps}) => (
      <span
        className={c('nc-toggle', className, { 'nc-toggle-active': on })}
        role="switch"
        aria-checked={on.toString()}
        {...getElementTogglerProps()}
      >
        <span className="nc-toggle-background"/>
        <span className="nc-toggle-switch"/>
      </span>
    )}
  </ReactToggled>;
