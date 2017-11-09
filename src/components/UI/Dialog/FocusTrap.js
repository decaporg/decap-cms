import React from 'react';
import FocusTrapReact from 'focus-trap-react';

/**
 * A wrapper for focus-trap-react, which we use to completely remove focus traps
 * from the DOM rather than using the library's own internal activation/pausing
 * mechanisms, which can manifest bugs when nested.
 */
const FocusTrap = props => {
  const { active, children, focusTrapOptions, className } = props;
  return active
    ? <FocusTrapReact focusTrapOptions={focusTrapOptions} className={className}>{children}</FocusTrapReact>
    : <div className={className}>{children}</div>
}

export default FocusTrap;
