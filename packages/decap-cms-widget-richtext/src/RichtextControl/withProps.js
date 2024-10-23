import React from 'react';

export default function withProps(Component, defaultProps) {
  const ComponentWithClassName = Component;

  return React.forwardRef(function ExtendComponent(props, ref) {
    return <ComponentWithClassName ref={ref} {...defaultProps} {...props} />;
  });
}
