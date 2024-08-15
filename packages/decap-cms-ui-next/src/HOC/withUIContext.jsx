import React from 'react';

import { UIContext } from '../UIContext';

export function withUIContext(Component) {
  return function WithUIContext(props) {
    return (
      <UIContext.Consumer>{context => <Component {...context} {...props} />}</UIContext.Consumer>
    );
  };
}
