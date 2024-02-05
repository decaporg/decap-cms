import React from 'react';

import { UIContext } from '../UIContext';

export function withUIContext(Component) {
  return props => (
    <UIContext.Consumer>{context => <Component {...props} {...context} />}</UIContext.Consumer>
  );
}
