import React from 'react';

function Pane(props) {
  const { children, className, split, style: styleProps, size, eleRef } = props;

  const classes = ['Pane', split, className];

  let style = {
    flex: 1,
    position: 'relative',
    outline: 'none',
  };

  if (size !== undefined) {
    if (split === 'vertical') {
      style.width = size;
    } else {
      style.height = size;
      style.display = 'flex';
    }
    style.flex = 'none';
  }

  style = Object.assign({}, style, styleProps || {});

  return (
    <div ref={eleRef} className={classes.join(' ')} style={style}>
      {children}
    </div>
  );
}

export default Pane;
