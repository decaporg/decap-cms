import React from 'react'
import ReactToggled from 'react-toggled';
import c from 'classnames';

export const Toggle = ({
  active,
  onChange,
  className,
  classNameBackground,
  classNameSwitch,
  onFocus,
  onBlur
}) =>
  <ReactToggled on={active} onToggle={onChange}>
    {({on, getElementTogglerProps}) => (
      <span
        className={c('nc-toggle', className, { 'nc-toggle-active': on })}
        role="switch"
        aria-checked={on.toString()}
        onFocus={onFocus}
        onBlur={onBlur}
        {...getElementTogglerProps()}
      >
        <span className={`nc-toggle-background ${classNameBackground}`}/>
        <span className={`nc-toggle-switch ${classNameSwitch}`}/>
      </span>
    )}
  </ReactToggled>;
